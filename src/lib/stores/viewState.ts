/**
 * View state: filters and sorting for contract list
 */

import { writable, derived } from 'svelte/store';
import type { ContractRecord, ContractType } from '../types';
import { inventory } from './inventory';

// Types
export type SortField = 'label' | 'chain' | 'type' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

interface FilterState {
  searchQuery: string;
  selectedChain: number | 'all';
  selectedType: ContractType | 'all';
  selectedTags: string[];
}

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

interface ViewState {
  filters: FilterState;
  sort: SortState;
}

// Initial state
const initialState: ViewState = {
  filters: {
    searchQuery: '',
    selectedChain: 'all',
    selectedType: 'all',
    selectedTags: []
  },
  sort: {
    field: null,
    direction: 'asc'
  }
};

// Create store
function createViewStateStore() {
  const { subscribe, update } = writable<ViewState>(initialState);

  return {
    subscribe,

    // Filter actions
    setSearchQuery: (query: string) => {
      update((s) => ({ ...s, filters: { ...s.filters, searchQuery: query } }));
    },

    setChain: (chainId: number | 'all') => {
      update((s) => ({ ...s, filters: { ...s.filters, selectedChain: chainId } }));
    },

    setType: (type: ContractType | 'all') => {
      update((s) => ({ ...s, filters: { ...s.filters, selectedType: type } }));
    },

    toggleTag: (tag: string) => {
      update((s) => ({
        ...s,
        filters: {
          ...s.filters,
          selectedTags: s.filters.selectedTags.includes(tag)
            ? s.filters.selectedTags.filter((t) => t !== tag)
            : [...s.filters.selectedTags, tag]
        }
      }));
    },

    // Sort actions
    toggleSort: (field: SortField) => {
      update((s) => ({
        ...s,
        sort:
          s.sort.field === field
            ? { field, direction: s.sort.direction === 'asc' ? 'desc' : 'asc' }
            : { field, direction: 'asc' }
      }));
    },

    // Reset
    reset: () => update(() => initialState)
  };
}

const store = createViewStateStore();

// Export the store and its actions
export const viewState = {
  subscribe: store.subscribe,
  ...store
};

// Convenience exports for backwards compatibility
export const filters = {
  subscribe: derived(store, ($vs) => $vs.filters).subscribe,
  setSearchQuery: store.setSearchQuery,
  setChain: store.setChain,
  setType: store.setType,
  toggleTag: store.toggleTag
};

export const sort = {
  subscribe: derived(store, ($vs) => $vs.sort).subscribe,
  toggleSort: store.toggleSort
};

// Derived: filtered contracts
const filteredContracts = derived([inventory, filters], ([$inventory, $filters]) => {
  let result = $inventory;

  // Filter by chain
  if ($filters.selectedChain !== 'all') {
    result = result.filter((c) => c.chainId === $filters.selectedChain);
  }

  // Filter by type
  if ($filters.selectedType !== 'all') {
    result = result.filter((c) => c.type === $filters.selectedType);
  }

  // Filter by tags (AND logic)
  if ($filters.selectedTags.length > 0) {
    result = result.filter((c) => $filters.selectedTags.every((tag) => c.tags.includes(tag)));
  }

  // Filter by search query
  if ($filters.searchQuery.trim()) {
    const query = $filters.searchQuery.toLowerCase();
    result = result.filter(
      (c) =>
        c.label.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query) ||
        c.source?.toLowerCase().includes(query) ||
        c.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  return result;
});

// Derived: sorted and filtered contracts
export const sortedContracts = derived([filteredContracts, sort], ([$filtered, $sort]) => {
  if (!$sort.field) return $filtered;

  const contracts = [...$filtered];
  const direction = $sort.direction === 'asc' ? 1 : -1;

  contracts.sort((a, b) => {
    let aVal: any, bVal: any;

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
});
