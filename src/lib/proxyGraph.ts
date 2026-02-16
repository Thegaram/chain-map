/**
 * Proxy-Implementation relationship graph utilities
 *
 * Computes relationships between proxy and implementation contracts dynamically.
 */

import type { ContractRecord } from './types';

export interface ProxyRelationship {
  proxyContract: ContractRecord;
  implementationContract: ContractRecord | null; // null if not in inventory
  implementationAddress: string;
}

/**
 * Find all proxies that use a given implementation contract
 */
export function getProxiesForImplementation(
  implementationId: string,
  contracts: ContractRecord[]
): ContractRecord[] {
  const implementation = contracts.find(c => c.id === implementationId);
  if (!implementation) return [];

  const implementationAddress = implementation.address.toLowerCase();

  return contracts.filter(
    c => c.implementation?.toLowerCase() === implementationAddress
  );
}

/**
 * Get implementation contract for a proxy
 * Returns the contract record if it exists in inventory, null otherwise
 */
export function getImplementationForProxy(
  proxyId: string,
  contracts: ContractRecord[]
): ContractRecord | null {
  const proxy = contracts.find(c => c.id === proxyId);
  if (!proxy || !proxy.implementation) return null;

  const implementationAddress = proxy.implementation.toLowerCase();
  return contracts.find(c => c.address.toLowerCase() === implementationAddress) || null;
}

/**
 * Check if contract is an orphan implementation (no proxies use it)
 */
export function isOrphanImplementation(
  contractId: string,
  contracts: ContractRecord[]
): boolean {
  const contract = contracts.find(c => c.id === contractId);
  if (!contract || contract.type !== 'implementation') return false;

  // Check if any proxy points to this implementation
  const proxies = getProxiesForImplementation(contractId, contracts);
  return proxies.length === 0;
}

/**
 * Check if contract is a proxy
 */
export function isProxy(contract: ContractRecord): boolean {
  return contract.type === 'proxy' && !!contract.implementation;
}

/**
 * Get all proxy-implementation relationships
 */
export function getAllProxyRelationships(
  contracts: ContractRecord[]
): ProxyRelationship[] {
  return contracts
    .filter(isProxy)
    .map(proxy => ({
      proxyContract: proxy,
      implementationContract: getImplementationForProxy(proxy.id, contracts),
      implementationAddress: proxy.implementation!
    }));
}
