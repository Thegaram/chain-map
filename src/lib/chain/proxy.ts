/**
 * Proxy detection utilities
 */

import { type Address, getAddress } from 'viem';
import { getClient } from './rpcClient';

export type ProxyType = 'eip1967' | 'eip1167' | 'none';

export interface ProxyInfo {
  isProxy: boolean;
  type: ProxyType;
  implementation?: Address;
}

// EIP-1967 storage slots
const EIP1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const EIP1967_BEACON_SLOT = '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50';

// EIP-1167 minimal proxy bytecode pattern
const EIP1167_PATTERN = /^0x363d3d373d3d3d363d73(.{40})5af43d82803e903d91602b57fd5bf3/;

/**
 * Detect if contract is an EIP-1967 proxy and get implementation
 */
async function detectEIP1967(address: Address, chainId: number): Promise<ProxyInfo> {
  const client = getClient(chainId);

  try {
    // Check implementation slot
    const implStorage = await client.getStorageAt({
      address,
      slot: EIP1967_IMPLEMENTATION_SLOT as `0x${string}`
    });

    if (implStorage && implStorage !== '0x' + '0'.repeat(64)) {
      // Extract address from storage (last 20 bytes)
      const implAddress = '0x' + implStorage.slice(-40);

      try {
        return {
          isProxy: true,
          type: 'eip1967',
          implementation: getAddress(implAddress)
        };
      } catch {
        // Invalid address in storage
      }
    }

    // Check beacon slot
    const beaconStorage = await client.getStorageAt({
      address,
      slot: EIP1967_BEACON_SLOT as `0x${string}`
    });

    if (beaconStorage && beaconStorage !== '0x' + '0'.repeat(64)) {
      const beaconAddress = '0x' + beaconStorage.slice(-40);

      try {
        return {
          isProxy: true,
          type: 'eip1967',
          implementation: getAddress(beaconAddress)
        };
      } catch {
        // Invalid address in storage
      }
    }
  } catch (error) {
    console.error('Error checking EIP-1967:', error);
  }

  return { isProxy: false, type: 'none' };
}

/**
 * Detect if contract is an EIP-1167 minimal proxy
 */
async function detectEIP1167(address: Address, chainId: number): Promise<ProxyInfo> {
  const client = getClient(chainId);

  try {
    const bytecode = await client.getBytecode({ address });

    if (!bytecode) {
      return { isProxy: false, type: 'none' };
    }

    const match = bytecode.match(EIP1167_PATTERN);

    if (match && match[1]) {
      const implAddress = '0x' + match[1];

      try {
        return {
          isProxy: true,
          type: 'eip1167',
          implementation: getAddress(implAddress)
        };
      } catch {
        // Invalid address pattern
      }
    }
  } catch (error) {
    console.error('Error checking EIP-1167:', error);
  }

  return { isProxy: false, type: 'none' };
}

/**
 * Detect proxy type and implementation address
 */
export async function detectProxy(address: Address, chainId: number): Promise<ProxyInfo> {
  // Check EIP-1967 first (more common)
  const eip1967 = await detectEIP1967(address, chainId);
  if (eip1967.isProxy) {
    return eip1967;
  }

  // Check EIP-1167
  const eip1167 = await detectEIP1167(address, chainId);
  if (eip1167.isProxy) {
    return eip1167;
  }

  return { isProxy: false, type: 'none' };
}

/**
 * Format proxy type for display
 */
export function formatProxyType(type: ProxyType): string {
  switch (type) {
    case 'eip1967':
      return 'EIP-1967 (UUPS/Transparent)';
    case 'eip1167':
      return 'EIP-1167 (Minimal Proxy)';
    default:
      return 'Not a proxy';
  }
}
