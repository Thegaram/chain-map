/**
 * Blockchain explorer API integration (Etherscan-compatible)
 */

import type { ChainConfig } from './types';

export interface ExplorerAbiResult {
  abi: any[];
  contractName?: string;
  compilerVersion?: string;
  implementation?: string; // For proxies
}

/**
 * Fetch contract ABI from explorer
 */
export async function fetchAbiFromExplorer(
  address: string,
  chain: ChainConfig
): Promise<ExplorerAbiResult | null> {
  if (!chain.explorerApiUrl) {
    throw new Error(`No explorer API URL configured for ${chain.name}`);
  }

  try {
    // Etherscan-compatible API (supports both V1 and V2)
    // V2 uses single unified endpoint (api.etherscan.io/v2/api) with chainid parameter
    const url = new URL(chain.explorerApiUrl);

    // V2 APIs require chainid parameter
    const isV2 = chain.explorerApiUrl.includes('/v2/');
    if (isV2) {
      url.searchParams.set('chainid', chain.chainId.toString());
    }

    url.searchParams.set('module', 'contract');
    url.searchParams.set('action', 'getsourcecode');
    url.searchParams.set('address', address);

    // Add API key if configured
    if (chain.explorerApiKey) {
      url.searchParams.set('apikey', chain.explorerApiKey);
    }

    const response = await fetch(url.toString());

    // Handle non-JSON responses (404, HTML error pages, etc.)
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error(
        `${chain.name} explorer returned non-JSON response. The explorer API may not be available.`
      );
    }

    const data = await response.json();

    if (data.status !== '1' || !data.result || data.result.length === 0) {
      // Check for specific error messages
      if (data.result && typeof data.result === 'string') {
        if (data.result.includes('API key') || data.result.includes('Invalid API Key')) {
          throw new Error(
            `${chain.name} explorer requires a valid API key. Please add one in chain settings.`
          );
        }
        if (data.result.includes('rate limit')) {
          throw new Error(
            `${chain.name} explorer rate limit exceeded. Please add an API key or try again later.`
          );
        }
      }

      return null;
    }

    const result = data.result[0];

    // Check if contract is verified
    if (result.ABI === 'Contract source code not verified') {
      return null;
    }

    let abi: any[];
    try {
      abi = JSON.parse(result.ABI);
    } catch (error) {
      console.error('Failed to parse ABI:', error);
      return null;
    }

    return {
      abi,
      contractName: result.ContractName || undefined,
      compilerVersion: result.CompilerVersion || undefined,
      implementation: result.Implementation || undefined
    };
  } catch (error) {
    console.error('Failed to fetch ABI from explorer:', error);
    throw error;
  }
}

/**
 * Fetch ABI for a contract, trying implementation if it's a proxy
 */
export async function fetchAbiSmart(
  address: string,
  chain: ChainConfig,
  implementation?: string
): Promise<ExplorerAbiResult | null> {
  // If we have a known implementation address (proxy), fetch that ABI first
  if (implementation) {
    const implResult = await fetchAbiFromExplorer(implementation, chain);
    if (implResult && implResult.abi.length > 0) {
      return {
        ...implResult,
        implementation: implementation
      };
    }
  }

  // Try to fetch ABI for the contract itself
  const result = await fetchAbiFromExplorer(address, chain);

  // If we got a good ABI, return it
  if (result && result.abi.length > 0) {
    return result;
  }

  // If explorer returned a proxy with implementation, try fetching that ABI
  if (result?.implementation) {
    const implResult = await fetchAbiFromExplorer(result.implementation, chain);
    if (implResult && implResult.abi.length > 0) {
      return {
        ...implResult,
        implementation: result.implementation
      };
    }
  }

  return result; // Return what we have, even if ABI is empty
}
