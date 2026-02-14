/**
 * UI state: drawer, keyboard focus, and toasts
 */

import { writable, derived, get } from 'svelte/store';
import { sortedContracts } from './viewState';

// --- Drawer State ---

interface DrawerState {
  open: boolean;
  contractId: string | null;
  tab: 'details' | 'abi';
}

const drawerState = writable<DrawerState>({
  open: false,
  contractId: null,
  tab: 'details'
});

export const selectedContractId = derived(drawerState, $d => $d.contractId);
export const drawerOpen = derived(drawerState, $d => $d.open);
export const activeTab = derived(drawerState, $d => $d.tab);

export function openDrawer(contractId: string) {
  drawerState.set({ open: true, contractId, tab: 'details' });
}

export function closeDrawer() {
  drawerState.set({ open: false, contractId: null, tab: 'details' });
}

export function setActiveTab(tab: 'details' | 'abi') {
  drawerState.update(d => ({ ...d, tab }));
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

    keyboardFocusIndex.update(index => {
      const newIndex = index + 1;
      return newIndex >= contracts.length ? contracts.length - 1 : newIndex;
    });
  },

  previous: () => {
    keyboardFocusIndex.update(index => {
      const newIndex = index - 1;
      return newIndex < 0 ? 0 : newIndex;
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
    toasts.update(list => [...list, { id, message, type }]);

    setTimeout(() => {
      toasts.update(list => list.filter(t => t.id !== id));
    }, duration);
  },

  dismiss: (id: string) => {
    toasts.update(list => list.filter(t => t.id !== id));
  }
};
