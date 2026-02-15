import { writable, derived } from 'svelte/store';
import type { ChainConfig } from '../types';
import { DEFAULT_CHAINS } from '../types';

/**
 * Chain configuration store
 */
function createChainsStore() {
  const { subscribe, set, update } = writable<ChainConfig[]>(DEFAULT_CHAINS);

  return {
    subscribe,
    set,

    /**
     * Add a custom chain
     */
    addChain: (chain: ChainConfig) => {
      update((chains) => [...chains, chain]);
    },

    /**
     * Update chain configuration
     */
    updateChain: (chainId: number, updates: Partial<ChainConfig>) => {
      update((chains) =>
        chains.map((chain) => (chain.chainId === chainId ? { ...chain, ...updates } : chain))
      );
    },

    /**
     * Remove a custom chain
     */
    removeChain: (chainId: number) => {
      update((chains) => chains.filter((c) => c.chainId !== chainId));
    },

    /**
     * Reset to default chains
     */
    reset: () => set(DEFAULT_CHAINS),

    /**
     * Load chains from data
     */
    load: (chains: ChainConfig[]) => set(chains)
  };
}

export const chains = createChainsStore();

/**
 * Derived store: Map of chainId -> ChainConfig for quick lookups
 */
export const chainMap = derived(chains, ($chains) => {
  const map = new Map<number, ChainConfig>();
  $chains.forEach((chain) => map.set(chain.chainId, chain));
  return map;
});
