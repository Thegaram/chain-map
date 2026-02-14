/**
 * Automatic fetching of missing on-chain data
 */

import type { Address } from 'viem';
import type { ContractRecord } from '../types';
import { getBytecodeInfo } from './bytecode';
import { detectProxy } from './proxy';
import type { ContractType } from '../types';

/**
 * Fetch missing codehash and bytecode size for a contract
 */
async function fetchMissingBytecode(contract: ContractRecord): Promise<Partial<ContractRecord> | null> {
  if (contract.codehash) {
    return null; // Already has codehash
  }

  try {
    const bytecodeInfo = await getBytecodeInfo(
      contract.address as Address,
      contract.chainId
    );

    if (bytecodeInfo.isEmpty) {
      return null;
    }

    return {
      codehash: bytecodeInfo.codehash,
      bytecodeSize: bytecodeInfo.size
    };
  } catch (err) {
    console.error(`Failed to fetch bytecode for ${contract.label}:`, err);
    return null;
  }
}

/**
 * Fetch missing proxy information for a contract
 */
async function fetchMissingProxy(contract: ContractRecord): Promise<Partial<ContractRecord> | null> {
  if (contract.proxyType !== undefined) {
    return null; // Already has proxy info
  }

  try {
    const proxyInfo = await detectProxy(
      contract.address as Address,
      contract.chainId
    );

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

/**
 * Fetch all missing on-chain data for a contract
 */
export async function fetchMissingData(
  contract: ContractRecord,
  updateFn: (id: string, updates: Partial<ContractRecord>) => void
): Promise<void> {
  // Fetch bytecode and proxy info in parallel
  const [bytecodeUpdates, proxyUpdates] = await Promise.all([
    fetchMissingBytecode(contract),
    fetchMissingProxy(contract)
  ]);

  // Merge updates and apply if any data was fetched
  const updates = { ...bytecodeUpdates, ...proxyUpdates };
  if (Object.keys(updates).length > 0) {
    updateFn(contract.id, updates);
  }
}

/**
 * Fetch missing data for multiple contracts in batches
 */
export async function fetchMissingDataBatch(
  contracts: ContractRecord[],
  updateFn: (id: string, updates: Partial<ContractRecord>) => void,
  batchSize: number = 5
): Promise<void> {
  // Filter contracts that need updates
  const contractsNeedingUpdates = contracts.filter(
    c => !c.codehash || c.proxyType === undefined
  );

  if (contractsNeedingUpdates.length === 0) {
    return;
  }

  // Process in batches to avoid overwhelming RPC endpoints
  for (let i = 0; i < contractsNeedingUpdates.length; i += batchSize) {
    const batch = contractsNeedingUpdates.slice(i, i + batchSize);
    await Promise.all(
      batch.map(contract => fetchMissingData(contract, updateFn))
    );
  }
}
