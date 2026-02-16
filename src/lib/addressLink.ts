/**
 * Smart address linking: link to inventory or explorer
 */

import type { ContractRecord, ChainConfig } from './types';
import { getExplorerAddressUrl } from './links';

export interface AddressLink {
  address: string;
  type: 'inventory' | 'explorer';
  label?: string; // Contract label if in inventory
  contractId?: string; // Contract ID if in inventory
  url?: string; // Explorer URL if not in inventory
}

/**
 * Create a link for an address
 * If address exists in inventory, link to that contract
 * Otherwise, link to block explorer
 */
export function createAddressLink(
  address: string,
  inventory: ContractRecord[],
  chain?: ChainConfig
): AddressLink {
  // Normalize address
  const normalizedAddress = address.toLowerCase();

  // Check if address exists in inventory
  const contract = inventory.find((c) => c.address.toLowerCase() === normalizedAddress);

  if (contract) {
    return {
      address,
      type: 'inventory',
      label: contract.label,
      contractId: contract.id
    };
  }

  // Not in inventory, link to explorer
  const explorerUrl = chain ? getExplorerAddressUrl(address, chain) : undefined;

  return {
    address,
    type: 'explorer',
    url: explorerUrl || undefined
  };
}

/**
 * Create links for multiple addresses
 */
export function createAddressLinks(
  addresses: string[],
  inventory: ContractRecord[],
  chain?: ChainConfig
): AddressLink[] {
  return addresses.map((addr) => createAddressLink(addr, inventory, chain));
}

/**
 * Format address for display (shortened)
 */
export function formatAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
