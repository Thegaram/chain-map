import { writable, derived, get } from 'svelte/store';
import type { ContractRecord } from '../types';
import { history } from './history';

/**
 * Main inventory store containing all contract records
 */
function createInventoryStore() {
  const { subscribe, set, update } = writable<ContractRecord[]>([]);

  // Helper to record state before changes
  function recordBeforeChange() {
    const currentState = get({ subscribe });
    history.recordState([...currentState]); // Deep copy
  }

  return {
    subscribe,
    set,

    /**
     * Add a new contract to the inventory
     */
    addContract: (contract: Omit<ContractRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      recordBeforeChange();

      const newContract: ContractRecord = {
        ...contract,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      update(contracts => [...contracts, newContract]);
      return newContract;
    },

    /**
     * Update an existing contract
     */
    updateContract: (id: string, updates: Partial<Omit<ContractRecord, 'id' | 'createdAt'>>) => {
      recordBeforeChange();

      update(contracts =>
        contracts.map(contract =>
          contract.id === id
            ? { ...contract, ...updates, updatedAt: Date.now() }
            : contract
        )
      );
    },

    /**
     * Remove a contract from the inventory
     */
    deleteContract: (id: string) => {
      recordBeforeChange();
      update(contracts => contracts.filter(c => c.id !== id));
    },

    /**
     * Get a contract by ID
     */
    getContract: (id: string): ContractRecord | undefined => {
      return get({ subscribe }).find(c => c.id === id);
    },

    /**
     * Clear all contracts
     */
    clear: () => {
      recordBeforeChange();
      set([]);
    },

    /**
     * Load contracts from data
     */
    load: (contracts: ContractRecord[]) => {
      set(contracts);
      history.init();
    },

    /**
     * Undo the last change
     */
    undo: (): boolean => {
      const currentState = get({ subscribe });
      const previousState = history.undo(currentState);
      if (previousState) {
        set(previousState);
        return true;
      }
      return false;
    },

    /**
     * Redo the last undone change
     */
    redo: (): boolean => {
      const currentState = get({ subscribe });
      const nextState = history.redo(currentState);
      if (nextState) {
        set(nextState);
        return true;
      }
      return false;
    },

    /**
     * Check if undo is available
     */
    canUndo: () => history.canUndo(),

    /**
     * Check if redo is available
     */
    canRedo: () => history.canRedo(),
  };
}

export const inventory = createInventoryStore();

/**
 * Derived store for all unique tags across contracts
 */
export const allTags = derived(
  inventory,
  $inventory => {
    const tags = new Set<string>();
    $inventory.forEach(contract => {
      contract.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }
);
