/**
 * On-chain data fetching: RPC, bytecode, proxy detection, auto-fetch
 */

import { createPublicClient, http, type PublicClient, type Address, keccak256 } from 'viem';
import { mainnet, scroll, optimism, arbitrum, base } from 'viem/chains';
import type { ChainConfig, ContractRecord, ContractType } from './types';

// ============================================================================
// RPC Client Management
// ============================================================================

const CHAIN_MAP = {
  1: mainnet,
  534352: scroll,
  10: optimism,
  42161: arbitrum,
  8453: base
} as const;

const clientCache = new Map<number, PublicClient>();

export function getClient(chainId: number, rpcUrl?: string): PublicClient {
  const cached = clientCache.get(chainId);
  if (cached && !rpcUrl) return cached;

  const chain = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl || chain.rpcUrls.default.http[0])
  });

  if (!rpcUrl) {
    clientCache.set(chainId, client);
  }

  return client;
}

// ============================================================================
// Bytecode
// ============================================================================

export interface BytecodeInfo {
  codehash: string;
  size: number;
  isEmpty: boolean;
}

export async function getBytecodeInfo(address: Address, chainId: number): Promise<BytecodeInfo> {
  const client = getClient(chainId);
  const bytecode = await client.getBytecode({ address });

  if (!bytecode || bytecode === '0x') {
    return {
      codehash: '',
      size: 0,
      isEmpty: true
    };
  }

  return {
    codehash: keccak256(bytecode),
    size: (bytecode.length - 2) / 2, // Remove '0x' and divide by 2
    isEmpty: false
  };
}

export function formatBytecodeSize(bytes: number): string {
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
}

// ============================================================================
// Proxy Detection
// ============================================================================

export type ProxyType = 'eip1967' | 'eip1967-beacon' | 'eip1167' | 'transparent' | 'uups' | null;

export interface ProxyInfo {
  isProxy: boolean;
  type: ProxyType;
  implementation: string | null;
}

// EIP-1967 storage slots
const EIP1967_IMPLEMENTATION_SLOT =
  '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const EIP1967_BEACON_SLOT = '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50';

// EIP-1167 minimal proxy pattern
const EIP1167_PATTERN = /^0x363d3d373d3d3d363d73([0-9a-f]{40})5af43d82803e903d91602b57fd5bf3$/i;

export async function detectProxy(address: Address, chainId: number): Promise<ProxyInfo> {
  const client = getClient(chainId);

  try {
    // Check EIP-1967 implementation slot
    const implSlot = await client.getStorageAt({
      address,
      slot: EIP1967_IMPLEMENTATION_SLOT as `0x${string}`
    });

    if (
      implSlot &&
      implSlot !== '0x0000000000000000000000000000000000000000000000000000000000000000'
    ) {
      const implementation = '0x' + implSlot.slice(-40);
      return {
        isProxy: true,
        type: 'eip1967',
        implementation
      };
    }

    // Check EIP-1967 beacon slot
    const beaconSlot = await client.getStorageAt({
      address,
      slot: EIP1967_BEACON_SLOT as `0x${string}`
    });

    if (
      beaconSlot &&
      beaconSlot !== '0x0000000000000000000000000000000000000000000000000000000000000000'
    ) {
      return {
        isProxy: true,
        type: 'eip1967-beacon',
        implementation: null // Beacon pattern doesn't directly expose implementation
      };
    }

    // Check EIP-1167 minimal proxy pattern
    const bytecode = await client.getBytecode({ address });
    if (bytecode) {
      const match = bytecode.match(EIP1167_PATTERN);
      if (match && match[1]) {
        return {
          isProxy: true,
          type: 'eip1167',
          implementation: '0x' + match[1]
        };
      }
    }

    return {
      isProxy: false,
      type: null,
      implementation: null
    };
  } catch (error) {
    console.error('Proxy detection failed:', error);
    throw error;
  }
}

export function formatProxyType(type: ProxyType): string {
  if (!type) return 'Not a proxy';

  const names: Record<NonNullable<ProxyType>, string> = {
    eip1967: 'EIP-1967 Proxy',
    'eip1967-beacon': 'EIP-1967 Beacon',
    eip1167: 'EIP-1167 Minimal Proxy',
    transparent: 'Transparent Proxy',
    uups: 'UUPS Proxy'
  };

  return names[type] || type;
}

// ============================================================================
// Auto-Fetch Missing Data
// ============================================================================

async function fetchMissingBytecode(
  contract: ContractRecord
): Promise<Partial<ContractRecord> | null> {
  if (contract.codehash) return null;

  try {
    const bytecodeInfo = await getBytecodeInfo(contract.address as Address, contract.chainId);
    if (bytecodeInfo.isEmpty) return null;

    return {
      codehash: bytecodeInfo.codehash,
      bytecodeSize: bytecodeInfo.size
    };
  } catch (err) {
    console.error(`Failed to fetch bytecode for ${contract.label}:`, err);
    return null;
  }
}

async function fetchMissingProxy(
  contract: ContractRecord
): Promise<Partial<ContractRecord> | null> {
  if (contract.proxyType !== undefined) return null;

  try {
    const proxyInfo = await detectProxy(contract.address as Address, contract.chainId);
    const detectedType: ContractType = proxyInfo.isProxy ? 'proxy' : 'implementation';

    return {
      type: detectedType,
      proxyType: proxyInfo.type,
      implementation: proxyInfo.implementation || undefined
    };
  } catch (err) {
    console.error(`Failed to fetch proxy info for ${contract.label}:`, err);
    return null;
  }
}

export async function fetchMissingData(
  contract: ContractRecord,
  updateFn: (id: string, updates: Partial<ContractRecord>) => void
): Promise<void> {
  const [bytecodeUpdates, proxyUpdates] = await Promise.all([
    fetchMissingBytecode(contract),
    fetchMissingProxy(contract)
  ]);

  const updates = { ...bytecodeUpdates, ...proxyUpdates };
  if (Object.keys(updates).length > 0) {
    updateFn(contract.id, updates);
  }
}

export async function fetchMissingDataBatch(
  contracts: ContractRecord[],
  updateFn: (id: string, updates: Partial<ContractRecord>) => void,
  batchSize: number = 5
): Promise<void> {
  const contractsNeedingUpdates = contracts.filter((c) => !c.codehash || c.proxyType === undefined);

  if (contractsNeedingUpdates.length === 0) return;

  // Process in batches
  for (let i = 0; i < contractsNeedingUpdates.length; i += batchSize) {
    const batch = contractsNeedingUpdates.slice(i, i + batchSize);
    await Promise.all(batch.map((contract) => fetchMissingData(contract, updateFn)));
  }
}
