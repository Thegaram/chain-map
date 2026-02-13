import { writable, derived } from 'svelte/store';
import type { FilterState, ContractRecord, ContractType } from '../types';
import { inventory } from './inventory';

/**
 * Filter state store
 */
function createFiltersStore() {
  const defaultFilters: FilterState = {
    searchQuery: '',
    selectedChain: 'all',
    selectedType: 'all',
    selectedTags: [],
  };

  const { subscribe, set, update } = writable<FilterState>(defaultFilters);

  return {
    subscribe,
    update,

    setSearchQuery: (query: string) => {
      update(f => ({ ...f, searchQuery: query }));
    },

    setChain: (chainId: number | 'all') => {
      update(f => ({ ...f, selectedChain: chainId }));
    },

    setType: (type: ContractType | 'all') => {
      update(f => ({ ...f, selectedType: type }));
    },

    toggleTag: (tag: string) => {
      update(f => ({
        ...f,
        selectedTags: f.selectedTags.includes(tag)
          ? f.selectedTags.filter(t => t !== tag)
          : [...f.selectedTags, tag]
      }));
    },

    reset: () => set(defaultFilters),
  };
}

export const filters = createFiltersStore();

/**
 * Derived store: Filtered contracts based on current filter state
 */
export const filteredContracts = derived(
  [inventory, filters],
  ([$inventory, $filters]) => {
    let result = $inventory;

    // Filter by chain
    if ($filters.selectedChain !== 'all') {
      result = result.filter(c => c.chainId === $filters.selectedChain);
    }

    // Filter by type
    if ($filters.selectedType !== 'all') {
      result = result.filter(c => c.type === $filters.selectedType);
    }

    // Filter by tags
    if ($filters.selectedTags.length > 0) {
      result = result.filter(c =>
        $filters.selectedTags.some(tag => c.tags.includes(tag))
      );
    }

    // Filter by search query (fuzzy search on label, address, source)
    if ($filters.searchQuery.trim()) {
      const query = $filters.searchQuery.toLowerCase();
      result = result.filter(c =>
        c.label.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query) ||
        c.source?.toLowerCase().includes(query) ||
        c.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }
);
