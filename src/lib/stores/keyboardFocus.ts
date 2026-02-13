import { writable, derived, get } from 'svelte/store';
import { filteredContracts } from './filters';

/**
 * Store for keyboard-focused row index in the table
 * Separate from selectedContractId (which tracks the open drawer)
 */
function createKeyboardFocusStore() {
  const { subscribe, set, update } = writable<number>(-1);

  return {
    subscribe,
    set,

    /**
     * Move focus to the next row
     */
    focusNext: () => {
      const contracts = get(filteredContracts);
      if (contracts.length === 0) return;

      update(index => {
        const newIndex = index + 1;
        return newIndex >= contracts.length ? contracts.length - 1 : newIndex;
      });
    },

    /**
     * Move focus to the previous row
     */
    focusPrevious: () => {
      update(index => {
        const newIndex = index - 1;
        return newIndex < 0 ? 0 : newIndex;
      });
    },

    /**
     * Set focus to a specific index
     */
    focusIndex: (index: number) => {
      set(index);
    },

    /**
     * Clear focus
     */
    clearFocus: () => {
      set(-1);
    },

    /**
     * Initialize focus to first row if nothing is focused
     */
    initializeFocus: () => {
      const currentIndex = get({ subscribe });
      if (currentIndex === -1) {
        const contracts = get(filteredContracts);
        if (contracts.length > 0) {
          set(0);
        }
      }
    },
  };
}

export const keyboardFocusIndex = createKeyboardFocusStore();

/**
 * Derived store: Currently focused contract ID
 */
export const focusedContractId = derived(
  [keyboardFocusIndex, filteredContracts],
  ([$index, $contracts]) => {
    if ($index >= 0 && $index < $contracts.length) {
      return $contracts[$index].id;
    }
    return null;
  }
);
