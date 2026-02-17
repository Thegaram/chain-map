/**
 * View state: filters and sorting for contract list
 */

import { writable, derived, get } from 'svelte/store';
import type { ContractRecord, ContractType } from '../types';
import { inventory } from './inventory';
import { getImplementationForProxy } from '../proxyGraph';

// Types
export type SortField = 'label' | 'chain' | 'type' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface HierarchicalRow {
  contract: ContractRecord;
  level: number; // 0 = top-level, 1 = nested implementation
  isNested: boolean; // True for implementations nested under proxies
  parentId: string | null; // Parent proxy ID for nested implementations
  isVisible: boolean; // Whether row should be displayed (based on parent's collapsed state)
  canExpand: boolean; // True for proxies with implementations in inventory
}

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
    reset: () => update(() => initialState),

    // Proxy expansion toggle
    toggleProxyExpansion: (proxyId: string) => {
      inventory.updateContract(proxyId, {
        isCollapsed: !inventory.getContract(proxyId)?.isCollapsed
      });
    },

    // Expand all proxies
    expandAll: () => {
      const contracts = get(inventory);
      contracts.forEach((contract: ContractRecord) => {
        if (contract.type === 'proxy' && contract.implementation) {
          inventory.updateContract(contract.id, { isCollapsed: false });
        }
      });
    },

    // Collapse all proxies
    collapseAll: () => {
      const contracts = get(inventory);
      contracts.forEach((contract: ContractRecord) => {
        if (contract.type === 'proxy' && contract.implementation) {
          inventory.updateContract(contract.id, { isCollapsed: true });
        }
      });
    }
  };
}

const store = createViewStateStore();

// Export the store and its actions
export const viewState = {
  ...store
};

export const toggleProxyExpansion = store.toggleProxyExpansion;

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

// Derived: hierarchical contracts (with proxy-implementation nesting)
export const hierarchicalContracts = derived(
  [sortedContracts, inventory],
  ([$sorted, $inventory]) => {
    const rows: HierarchicalRow[] = [];

    // Build a set of implementation IDs that are used by proxies (for duplication)
    const implementationIdsUsedByProxies = new Set<string>();
    $sorted.forEach((contract) => {
      if (contract.type === 'proxy' && contract.implementation) {
        const impl = $inventory.find(
          (c) => c.address.toLowerCase() === contract.implementation?.toLowerCase()
        );
        if (impl) {
          implementationIdsUsedByProxies.add(impl.id);
        }
      }
    });

    // Iterate through sorted contracts
    $sorted.forEach((contract) => {
      // Skip implementations that are used by proxies (they'll be added as nested rows)
      if (contract.type === 'implementation' && implementationIdsUsedByProxies.has(contract.id)) {
        return;
      }

      // Add top-level row (proxy or orphan implementation)
      const isProxyWithImpl = contract.type === 'proxy' && !!contract.implementation;
      const implementation = isProxyWithImpl
        ? getImplementationForProxy(contract.id, $inventory)
        : null;

      rows.push({
        contract,
        level: 0,
        isNested: false,
        parentId: null,
        isVisible: true,
        canExpand: !!implementation
      });

      // If proxy with implementation in inventory, add nested implementation row
      if (implementation) {
        const isCollapsed = contract.isCollapsed ?? true; // Default to collapsed
        rows.push({
          contract: implementation,
          level: 1,
          isNested: true,
          parentId: contract.id,
          isVisible: !isCollapsed,
          canExpand: false
        });
      }
    });

    return rows;
  }
);
