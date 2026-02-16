/**
 * ABI parsing and view function calling with caching
 */

import { type Address, decodeFunctionResult, encodeFunctionData } from 'viem';
import type { ChainConfig } from './types';
import { executeWithRetry } from './onchain';

export interface AbiFunction {
  name: string;
  type: 'function' | 'constructor' | 'fallback' | 'receive';
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  inputs: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
}

export interface ViewFunctionCall {
  name: string;
  inputs: Array<{ name: string; type: string }>;
  outputs: Array<{ name: string; type: string }>;
  requiresInput: boolean;
  result?: any;
  loading?: boolean;
  error?: string;
}

/**
 * Parse ABI and extract view functions
 */
export function parseViewFunctions(abi: any[]): AbiFunction[] {
  return abi.filter(
    (item) =>
      item.type === 'function' &&
      (item.stateMutability === 'view' || item.stateMutability === 'pure')
  ) as AbiFunction[];
}

/**
 * Check if function requires input parameters
 */
export function requiresInput(func: AbiFunction): boolean {
  return func.inputs.length > 0;
}

/**
 * Call a view function with no parameters
 */
export async function callViewFunction(
  address: Address,
  chainId: number,
  abi: any[],
  functionName: string,
  args: any[] = [],
  chainConfig?: ChainConfig
): Promise<any> {
  return executeWithRetry(chainId, chainConfig, async (client) => {
    const data = encodeFunctionData({
      abi,
      functionName,
      args
    });

    const result = await client.call({
      to: address,
      data
    });

    if (!result.data) {
      throw new Error('No data returned from contract call');
    }

    // Find the function in ABI to get output types
    const funcAbi = abi.find((item) => item.type === 'function' && item.name === functionName);

    if (!funcAbi) {
      throw new Error(`Function ${functionName} not found in ABI`);
    }

    const decoded = decodeFunctionResult({
      abi,
      functionName,
      data: result.data
    });

    return decoded;
  });
}

/**
 * Format contract call result for display
 */
export function formatResult(value: any, type: string): string {
  if (value === null || value === undefined) {
    return '—';
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return `[${value.map((v) => formatResult(v, 'unknown')).join(', ')}]`;
  }

  // Handle addresses
  if (type.includes('address')) {
    return String(value);
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  // Handle BigInt
  if (typeof value === 'bigint') {
    // For large numbers, show both decimal and hex
    const decimal = value.toString();
    if (decimal.length > 10) {
      return `${decimal} (0x${value.toString(16)})`;
    }
    return decimal;
  }

  // Handle strings
  if (typeof value === 'string') {
    return value;
  }

  // Handle objects (structs/tuples)
  if (typeof value === 'object') {
    return JSON.stringify(value, (key, val) => (typeof val === 'bigint' ? val.toString() : val), 2);
  }

  return String(value);
}

/**
 * Extract all addresses from a result value
 */
export function extractAddresses(value: any): string[] {
  const addresses: string[] = [];

  function extract(val: any) {
    if (!val) return;

    // Check if it's an address (0x followed by 40 hex chars)
    if (typeof val === 'string' && /^0x[a-fA-F0-9]{40}$/.test(val)) {
      addresses.push(val);
      return;
    }

    // Recursively check arrays
    if (Array.isArray(val)) {
      val.forEach(extract);
      return;
    }

    // Recursively check objects
    if (typeof val === 'object') {
      Object.values(val).forEach(extract);
    }
  }

  extract(value);
  return addresses;
}

/**
 * Format function signature for display
 */
export function formatFunctionSignature(func: AbiFunction): string {
  const inputs = func.inputs
    .map((input) => {
      const name = input.name || '_';
      return `${input.type} ${name}`;
    })
    .join(', ');

  return `${func.name}(${inputs})`;
}

/**
 * Get return type description
 */
export function getReturnType(func: AbiFunction): string {
  if (func.outputs.length === 0) {
    return 'void';
  }

  if (func.outputs.length === 1) {
    return func.outputs[0].type;
  }

  return `(${func.outputs.map((o) => o.type).join(', ')})`;
}
