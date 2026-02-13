import { writable } from 'svelte/store';

/**
 * Store for the currently selected contract ID
 */
export const selectedContractId = writable<string | null>(null);

/**
 * Store for drawer open state
 */
export const drawerOpen = writable<boolean>(false);

/**
 * Store for active drawer tab
 */
export const activeTab = writable<'details' | 'onchain' | 'abi'>('details');

/**
 * Helper to open drawer with a contract
 */
export function openDrawer(contractId: string) {
  selectedContractId.set(contractId);
  drawerOpen.set(true);
  activeTab.set('details');
}

/**
 * Helper to close drawer
 */
export function closeDrawer() {
  drawerOpen.set(false);
  selectedContractId.set(null);
}
