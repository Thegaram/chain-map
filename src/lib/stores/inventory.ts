/**
 * Inventory store with built-in undo/redo
 */

import { writable, derived, get } from 'svelte/store';
import type { ContractRecord } from '../types';

const MAX_HISTORY = 50;

function createInventoryStore() {
  const { subscribe, set, update } = writable<ContractRecord[]>([]);

  // History state
  let past: ContractRecord[][] = [];
  let future: ContractRecord[][] = [];

  function recordBeforeChange() {
    const currentState = get({ subscribe });
    past = [...past, currentState].slice(-MAX_HISTORY);
    future = []; // Clear future when new action is taken
  }

  function clearHistory() {
    past = [];
    future = [];
  }

  return {
    subscribe,
    set,

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

    deleteContract: (id: string) => {
      recordBeforeChange();
      update(contracts => contracts.filter(c => c.id !== id));
    },

    getContract: (id: string): ContractRecord | undefined => {
      return get({ subscribe }).find(c => c.id === id);
    },

    clear: () => {
      recordBeforeChange();
      set([]);
    },

    load: (contracts: ContractRecord[]) => {
      set(contracts);
      clearHistory();
    },

    undo: (): boolean => {
      if (past.length === 0) return false;

      const currentState = get({ subscribe });
      const previousState = past[past.length - 1];

      past = past.slice(0, -1);
      future = [currentState, ...future];

      set(previousState);
      return true;
    },

    redo: (): boolean => {
      if (future.length === 0) return false;

      const currentState = get({ subscribe });
      const nextState = future[0];

      past = [...past, currentState];
      future = future.slice(1);

      set(nextState);
      return true;
    },

    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
  };
}

export const inventory = createInventoryStore();

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
