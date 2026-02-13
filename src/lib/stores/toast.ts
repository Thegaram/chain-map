import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    show: (message: string, type: 'success' | 'error' | 'info' = 'success', duration = 2000) => {
      const id = Math.random().toString(36).substring(7);
      const toast: Toast = { id, message, type, duration };

      update(toasts => [...toasts, toast]);

      setTimeout(() => {
        update(toasts => toasts.filter(t => t.id !== id));
      }, duration);
    },
    dismiss: (id: string) => {
      update(toasts => toasts.filter(t => t.id !== id));
    }
  };
}

export const toast = createToastStore();
