/**
 * Viem RPC client management
 */

import { createPublicClient, http, type PublicClient } from 'viem';
import { mainnet, scroll, optimism, arbitrum, base } from 'viem/chains';
import type { ChainConfig } from '../types';

// Map of chain ID to viem chain config
const CHAIN_MAP = {
  1: mainnet,
  534352: scroll,
  10: optimism,
  42161: arbitrum,
  8453: base
} as const;

// Client cache
const clientCache = new Map<number, PublicClient>();

/**
 * Get or create a viem public client for a chain
 */
export function getClient(chainId: number, rpcUrl?: string): PublicClient {
  // Check cache first
  const cached = clientCache.get(chainId);
  if (cached && !rpcUrl) {
    return cached;
  }

  // Get chain config
  const chain = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  // Create client
  const client = createPublicClient({
    chain,
    transport: http(rpcUrl || chain.rpcUrls.default.http[0])
  });

  // Cache if using default URL
  if (!rpcUrl) {
    clientCache.set(chainId, client);
  }

  return client;
}

/**
 * Get client with custom RPC from chain config
 */
export function getClientFromConfig(config: ChainConfig): PublicClient {
  const rpcUrl = config.rpcUrls[0]; // Use first RPC URL
  return getClient(config.chainId, rpcUrl);
}

/**
 * Test if an RPC endpoint is responsive
 */
export async function testRpcEndpoint(chainId: number, rpcUrl: string): Promise<boolean> {
  try {
    const client = getClient(chainId, rpcUrl);
    await client.getBlockNumber();
    return true;
  } catch (error) {
    console.error(`RPC endpoint ${rpcUrl} failed:`, error);
    return false;
  }
}

/**
 * Get first working RPC URL from a list
 */
export async function getWorkingRpcUrl(
  chainId: number,
  rpcUrls: string[]
): Promise<string | null> {
  for (const url of rpcUrls) {
    const isWorking = await testRpcEndpoint(chainId, url);
    if (isWorking) {
      return url;
    }
  }
  return null;
}

/**
 * Clear client cache (useful for testing or RPC URL changes)
 */
export function clearClientCache(): void {
  clientCache.clear();
}
