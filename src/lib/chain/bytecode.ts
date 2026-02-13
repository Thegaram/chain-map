/**
 * Bytecode inspection utilities
 */

import { keccak256, type Address } from 'viem';
import { getClient } from './rpcClient';

export interface BytecodeInfo {
  bytecode: string;
  codehash: string;
  size: number;
  isEmpty: boolean;
}

/**
 * Fetch runtime bytecode and compute codehash
 */
export async function getBytecodeInfo(
  address: Address,
  chainId: number
): Promise<BytecodeInfo> {
  const client = getClient(chainId);

  const bytecode = await client.getBytecode({
    address
  });

  // Handle empty/non-existent contracts
  if (!bytecode || bytecode === '0x') {
    return {
      bytecode: '0x',
      codehash: '0x',
      size: 0,
      isEmpty: true
    };
  }

  // Compute codehash
  const codehash = keccak256(bytecode);

  return {
    bytecode,
    codehash,
    size: (bytecode.length - 2) / 2, // Remove 0x and divide by 2 for bytes
    isEmpty: false
  };
}

/**
 * Compare codehash with expected value
 */
export function compareCodehash(
  actual: string,
  expected: string | undefined
): { matches: boolean; reason?: string } {
  if (!expected) {
    return { matches: true, reason: 'No expected codehash provided' };
  }

  if (actual.toLowerCase() === expected.toLowerCase()) {
    return { matches: true };
  }

  return {
    matches: false,
    reason: 'Codehash mismatch'
  };
}

/**
 * Format bytecode size for display
 */
export function formatBytecodeSize(bytes: number): string {
  if (bytes === 0) return '0 bytes';
  if (bytes < 1024) return `${bytes} bytes`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}
