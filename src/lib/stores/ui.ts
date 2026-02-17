/**
 * UI state: drawer, keyboard focus, and toasts
 */

import { writable, derived, get } from 'svelte/store';
import { hierarchicalContracts } from './viewState';
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
      const newHistory = h.history.slice(0, h.currentIndex + 1);
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

  // Auto-expand if navigating to hidden implementation
  const contract = get(inventory).find((c) => c.id === contractId);
  if (contract) {
    autoExpandIfNeeded(contract);
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

// --- Keyboard Navigation State ---

let keyboardSelectedIndex = writable<number>(0);

// Use hierarchical contracts for keyboard navigation (respects visibility)
export const keyboardSelectedContract = derived(
  [keyboardSelectedIndex, hierarchicalContracts],
  ([$index, $rows]) => {
    const visibleRows = $rows.filter((r) => r.isVisible);
    return visibleRows[$index]?.contract || null;
  }
);

export const focusedContractId = derived(
  keyboardSelectedContract,
  ($contract) => $contract?.id || null
);

export const keyboardFocus = {
  next: () => {
    const rows = get(hierarchicalContracts);
    const visibleRows = rows.filter((r) => r.isVisible);

    if (visibleRows.length === 0) return;

    const currentIndex = get(keyboardSelectedIndex);
    const currentVisibleRow = visibleRows[currentIndex];
    if (!currentVisibleRow) {
      keyboardSelectedIndex.set(0);
      return;
    }

    // Find this EXACT row object in the full hierarchy (handles duplicates correctly)
    const fullIndex = rows.findIndex((r) => r === currentVisibleRow);
    if (fullIndex === -1) {
      // Shouldn't happen, but safety check
      keyboardSelectedIndex.set(Math.min(currentIndex + 1, visibleRows.length - 1));
      return;
    }

    const nextRowInFullHierarchy = rows[fullIndex + 1];

    // If next row exists but is hidden (collapsed child), expand its parent
    if (
      nextRowInFullHierarchy &&
      !nextRowInFullHierarchy.isVisible &&
      nextRowInFullHierarchy.parentId
    ) {
      inventory.updateContract(nextRowInFullHierarchy.parentId, { isCollapsed: false });
      // After expand, next press will move into the now-visible child
      return;
    }

    // Otherwise move to next visible row
    if (currentIndex < visibleRows.length - 1) {
      keyboardSelectedIndex.set(currentIndex + 1);
    }
  },
  previous: () => {
    keyboardSelectedIndex.update((i) => Math.max(i - 1, 0));
  }
};

// --- Auto-expand if navigating to hidden implementation ---

function autoExpandIfNeeded(contract: ContractRecord) {
  if (!contract) return;

  const rows = get(hierarchicalContracts);
  const row = rows.find((r) => r.contract.id === contract.id);

  if (row?.isNested && !row.isVisible && row.parentId) {
    const parentContract = get(inventory).find((c) => c.id === row.parentId);
    if (parentContract?.isCollapsed) {
      inventory.updateContract(row.parentId, { isCollapsed: false });
    }
  }
}

// --- Toast Notifications ---

interface ToastState {
  visible: boolean;
  message: string;
  type: 'info' | 'success' | 'error';
}

const toastState = writable<ToastState>({
  visible: false,
  message: '',
  type: 'info'
});

export const toastList = derived(toastState, ($state) => {
  if (!$state.visible) return [];
  return [
    {
      id: Date.now().toString(),
      message: $state.message,
      type: $state.type
    }
  ];
});

export const toast = {
  ...toastState,
  show: (message: string, type: 'info' | 'success' | 'error' = 'info', duration = 3000) => {
    toastState.set({ visible: true, message, type });
    if (duration > 0) {
      setTimeout(() => {
        toastState.update((t) => ({ ...t, visible: false }));
      }, duration);
    }
  },
  hide: () => {
    toastState.update((t) => ({ ...t, visible: false }));
  }
};

// --- Contract Form State ---

interface ContractFormState {
  open: boolean;
  initialAddress?: string;
  initialChainId?: number;
}

const contractFormState = writable<ContractFormState>({
  open: false
});

export const contractFormOpen = derived(contractFormState, ($s) => $s.open);
export const contractFormInitialAddress = derived(contractFormState, ($s) => $s.initialAddress);
export const contractFormInitialChainId = derived(contractFormState, ($s) => $s.initialChainId);

export function openContractForm(initialAddress?: string, initialChainId?: number) {
  contractFormState.set({ open: true, initialAddress, initialChainId });
}

export function closeContractForm() {
  contractFormState.set({ open: false });
}
