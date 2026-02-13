import { writable, get } from 'svelte/store';
import type { ContractRecord } from '../types';

interface HistoryState {
  past: ContractRecord[][];
  future: ContractRecord[][];
}

const MAX_HISTORY = 50;

function createHistoryStore() {
  const { subscribe, set, update } = writable<HistoryState>({
    past: [],
    future: []
  });

  return {
    subscribe,

    /**
     * Record a new state (typically called before making a change)
     */
    recordState: (currentState: ContractRecord[]) => {
      update(history => {
        // Add current state to past
        const newPast = [...history.past, currentState].slice(-MAX_HISTORY);

        return {
          past: newPast,
          future: [] // Clear future when new action is taken
        };
      });
    },

    /**
     * Undo - pop from past, return the state to restore to
     * The current state should be pushed to future by the caller
     */
    undo: (currentState: ContractRecord[]): ContractRecord[] | null => {
      const history = get({ subscribe });

      if (history.past.length === 0) {
        return null;
      }

      const previous = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, -1);

      set({
        past: newPast,
        future: [currentState, ...history.future]
      });

      return previous;
    },

    /**
     * Redo - pop from future, return the state to restore to
     * The current state should be pushed to past by the caller
     */
    redo: (currentState: ContractRecord[]): ContractRecord[] | null => {
      const history = get({ subscribe });

      if (history.future.length === 0) {
        return null;
      }

      const next = history.future[0];
      const newFuture = history.future.slice(1);

      set({
        past: [...history.past, currentState],
        future: newFuture
      });

      return next;
    },

    /**
     * Check if undo is available
     */
    canUndo: (): boolean => {
      return get({ subscribe }).past.length > 0;
    },

    /**
     * Check if redo is available
     */
    canRedo: (): boolean => {
      return get({ subscribe }).future.length > 0;
    },

    /**
     * Clear all history
     */
    clear: () => {
      set({
        past: [],
        future: []
      });
    },

    /**
     * Initialize - clear history when loading new data
     */
    init: () => {
      set({
        past: [],
        future: []
      });
    }
  };
}

export const history = createHistoryStore();
