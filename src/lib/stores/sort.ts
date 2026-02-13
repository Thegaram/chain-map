import { writable, derived } from 'svelte/store';
import { filteredContracts } from './filters';
import type { ContractRecord } from '../types';

export type SortField = 'label' | 'chain' | 'type' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

function createSortStore() {
  const { subscribe, update } = writable<SortState>({
    field: null,
    direction: 'asc'
  });

  return {
    subscribe,

    /**
     * Toggle sort by field
     */
    toggleSort: (field: SortField) => {
      update(state => {
        if (state.field === field) {
          // Same field - toggle direction
          return {
            field,
            direction: state.direction === 'asc' ? 'desc' : 'asc'
          };
        } else {
          // New field - default to ascending
          return {
            field,
            direction: 'asc'
          };
        }
      });
    },

    /**
     * Clear sort
     */
    clear: () => {
      update(() => ({
        field: null,
        direction: 'asc'
      }));
    }
  };
}

export const sort = createSortStore();

/**
 * Derived store: Sorted and filtered contracts
 */
export const sortedContracts = derived(
  [filteredContracts, sort],
  ([$filteredContracts, $sort]) => {
    if (!$sort.field) {
      // No sorting - return as is
      return $filteredContracts;
    }

    const contracts = [...$filteredContracts];
    const direction = $sort.direction === 'asc' ? 1 : -1;

    contracts.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch ($sort.field) {
        case 'label':
          aVal = a.label.toLowerCase();
          bVal = b.label.toLowerCase();
          break;
        case 'chain':
          aVal = a.chainId;
          bVal = b.chainId;
          break;
        case 'type':
          aVal = a.type;
          bVal = b.type;
          break;
        case 'updatedAt':
          aVal = a.updatedAt;
          bVal = b.updatedAt;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return -1 * direction;
      if (aVal > bVal) return 1 * direction;
      return 0;
    });

    return contracts;
  }
);
