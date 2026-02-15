import { writable } from 'svelte/store';
import type { AppSettings } from '../types';

/**
 * Application settings store
 */
function createSettingsStore() {
  const defaultSettings: AppSettings = {
    theme: 'system'
  };

  const { subscribe, set, update } = writable<AppSettings>(defaultSettings);

  // Load from localStorage on initialization
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('app-settings');
    if (stored) {
      try {
        set(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored settings:', e);
      }
    }
  }

  return {
    subscribe,

    /**
     * Update settings and persist to localStorage
     */
    update: (updater: (settings: AppSettings) => AppSettings) => {
      update((settings) => {
        const updated = updater(settings);
        if (typeof window !== 'undefined') {
          localStorage.setItem('app-settings', JSON.stringify(updated));
        }
        return updated;
      });
    },

    /**
     * Set theme
     */
    setTheme: (theme: AppSettings['theme']) => {
      update((settings) => {
        const updated = { ...settings, theme };
        if (typeof window !== 'undefined') {
          localStorage.setItem('app-settings', JSON.stringify(updated));
        }
        return updated;
      });
    },

    /**
     * Reset to defaults
     */
    reset: () => {
      set(defaultSettings);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('app-settings');
      }
    }
  };
}

export const settings = createSettingsStore();
