/**
 * UI state: drawer, keyboard focus, and toasts
 */

import { writable, derived, get } from 'svelte/store';
import { sortedContracts, hierarchicalContracts } from './viewState';
import { inventory } from './inventory';
import type { ContractRecord } from '../types';

// --- Drawer State ---

interface DrawerState {
  open: boolean;
  contractId: string | null;
  tab: 'details' | 'abi';
}

interface DrawerHistory {
  history: string[];
  currentIndex: number;
}

const drawerState = writable<DrawerState>({
  open: false,
  contractId: null,
  tab: 'details'
});

const drawerHistory = writable<DrawerHistory>({
  history: [],
  currentIndex: -1
});

export const selectedContractId = derived(drawerState, ($d) => $d.contractId);
export const drawerOpen = derived(drawerState, ($d) => $d.open);
export const activeTab = derived(drawerState, ($d) => $d.tab);

export const canGoBack = derived(drawerHistory, ($h) => $h.currentIndex > 0);
export const canGoForward = derived(drawerHistory, ($h) => $h.currentIndex < $h.history.length - 1);

export function openDrawer(contractId: string, skipHistory = false) {
  drawerState.set({ open: true, contractId, tab: 'details' });

  if (!skipHistory) {
    drawerHistory.update((h) => {
      // If we're not at the end of history, truncate the future
      const newHistory = h.history.slice(0, h.currentIndex + 1);
      // Add new contract ID (avoid duplicates of the same contract in a row)
      if (newHistory[newHistory.length - 1] !== contractId) {
        newHistory.push(contractId);
        return {
          history: newHistory,
          currentIndex: newHistory.length - 1
        };
      }
      return h;
    });
  }
}

export function closeDrawer() {
  drawerState.set({ open: false, contractId: null, tab: 'details' });
}

export function goBack() {
  const h = get(drawerHistory);
  if (h.currentIndex > 0) {
    const newIndex = h.currentIndex - 1;
    const contractId = h.history[newIndex];
    drawerHistory.set({ ...h, currentIndex: newIndex });
    drawerState.set({ open: true, contractId, tab: 'details' });
  }
}

export function goForward() {
  const h = get(drawerHistory);
  if (h.currentIndex < h.history.length - 1) {
    const newIndex = h.currentIndex + 1;
    const contractId = h.history[newIndex];
    drawerHistory.set({ ...h, currentIndex: newIndex });
    drawerState.set({ open: true, contractId, tab: 'details' });
  }
}

export function setActiveTab(tab: 'details' | 'abi') {
  drawerState.update((d) => ({ ...d, tab }));
}

// --- Keyboard Focus ---

const keyboardFocusIndex = writable<number>(-1);

export const focusedContractId = derived(
  [keyboardFocusIndex, sortedContracts],
  ([$index, $contracts]) => {
    if ($index >= 0 && $index < $contracts.length) {
      return $contracts[$index].id;
    }
    return null;
  }
);

export const keyboardFocus = {
  next: () => {
    const contracts = get(sortedContracts);
    if (contracts.length === 0) return;

    keyboardFocusIndex.update((index) => {
      const newIndex = index + 1;
      const finalIndex = newIndex >= contracts.length ? contracts.length - 1 : newIndex;

      // Auto-expand if navigating to a hidden nested implementation
      autoExpandIfNeeded(contracts[finalIndex]);

      return finalIndex;
    });
  },

  previous: () => {
    keyboardFocusIndex.update((index) => {
      const newIndex = index - 1;
      const finalIndex = newIndex < 0 ? 0 : newIndex;

      // Auto-expand if navigating to a hidden nested implementation
      const contracts = get(sortedContracts);
      autoExpandIfNeeded(contracts[finalIndex]);

      return finalIndex;
    });
  },

  set: (index: number) => {
    keyboardFocusIndex.set(index);
  },

  clear: () => {
    keyboardFocusIndex.set(-1);
  },

  initialize: () => {
    const currentIndex = get(keyboardFocusIndex);
    if (currentIndex === -1) {
      const contracts = get(sortedContracts);
      if (contracts.length > 0) {
        keyboardFocusIndex.set(0);
      }
    }
  }
};

// --- Contract Form Modal ---

interface ContractFormState {
  open: boolean;
  initialAddress?: string;
  initialChainId?: number;
}

const contractFormState = writable<ContractFormState>({
  open: false,
  initialAddress: undefined,
  initialChainId: undefined
});

export const contractFormOpen = derived(contractFormState, ($s) => $s.open);
export const contractFormInitialAddress = derived(contractFormState, ($s) => $s.initialAddress);
export const contractFormInitialChainId = derived(contractFormState, ($s) => $s.initialChainId);

export function openContractForm(initialAddress?: string, initialChainId?: number) {
  contractFormState.set({ open: true, initialAddress, initialChainId });
}

export function closeContractForm() {
  contractFormState.set({ open: false, initialAddress: undefined, initialChainId: undefined });
}

// --- Toast Notifications ---

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const toasts = writable<Toast[]>([]);

export const toastList = { subscribe: toasts.subscribe };

export const toast = {
  show: (message: string, type: 'success' | 'error' | 'info' = 'success', duration = 2000) => {
    const id = crypto.randomUUID();
    toasts.update((list) => [...list, { id, message, type }]);

    setTimeout(() => {
      toasts.update((list) => list.filter((t) => t.id !== id));
    }, duration);
  },

  dismiss: (id: string) => {
    toasts.update((list) => list.filter((t) => t.id !== id));
  }
};

// --- Helper Functions ---

/**
 * Auto-expand proxy if navigating to a hidden nested implementation
 */
function autoExpandIfNeeded(contract: ContractRecord) {
  if (!contract) return;

  const rows = get(hierarchicalContracts);
  const row = rows.find((r) => r.contract.id === contract.id);

  // If this is a nested implementation that's hidden, expand its parent
  if (row?.isNested && !row.isVisible && row.parentId) {
    const parentContract = get(inventory).find((c) => c.id === row.parentId);
    if (parentContract?.isCollapsed) {
      inventory.updateContract(row.parentId, { isCollapsed: false });
    }
  }
}
