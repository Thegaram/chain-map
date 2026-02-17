/**
 * Keyboard shortcuts manager
 */

import { keyboardFocus, focusedContractId, openDrawer, drawerOpen, toast } from './stores/ui';
import { inventory } from './stores/inventory';
import { get } from 'svelte/store';

export interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}

const shortcuts: ShortcutHandler[] = [];

export function registerShortcut(shortcut: ShortcutHandler) {
  shortcuts.push(shortcut);
}

export function unregisterShortcut(shortcut: ShortcutHandler) {
  const index = shortcuts.indexOf(shortcut);
  if (index > -1) {
    shortcuts.splice(index, 1);
  }
}

export function handleKeydown(event: KeyboardEvent) {
  // Don't trigger shortcuts when typing in inputs
  const target = event.target as HTMLElement;
  const isInInput =
    target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

  // Handle undo/redo (Cmd+Z / Cmd+Shift+Z)
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();

    if (event.shiftKey) {
      // Redo
      const success = inventory.redo();
      if (success) {
        toast.show('Redone', 'info');
      }
    } else {
      // Undo
      const success = inventory.undo();
      if (success) {
        toast.show('Undone', 'info');
      }
    }
    return;
  }

  // Handle arrow key navigation (unless in input)
  if (!isInInput && !get(drawerOpen)) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      keyboardFocus.next();
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      keyboardFocus.previous();
      return;
    }
    if (event.key === 'Enter') {
      const focusedId = get(focusedContractId);
      if (focusedId) {
        event.preventDefault();
        openDrawer(focusedId);
        return;
      }
    }
  }

  if (isInInput) {
    // Exception: Cmd/Ctrl+K should work even in inputs
    if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
      // Allow it
    } else {
      return;
    }
  }

  for (const shortcut of shortcuts) {
    const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
    if (!keyMatch) continue;

    // Handle cross-platform Cmd/Ctrl shortcuts
    // If both ctrl and meta are specified, match if EITHER is pressed
    let modifierMatch = true;

    if (shortcut.ctrl !== undefined || shortcut.meta !== undefined) {
      const wantsCtrlOrMeta = shortcut.ctrl || shortcut.meta;
      const hasCtrlOrMeta = event.ctrlKey || event.metaKey;

      if (wantsCtrlOrMeta && !hasCtrlOrMeta) {
        modifierMatch = false;
      } else if (!wantsCtrlOrMeta && hasCtrlOrMeta) {
        modifierMatch = false;
      }
    }

    const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;

    if (modifierMatch && shiftMatch) {
      event.preventDefault();
      shortcut.handler();
      break;
    }
  }
}

export function getShortcuts(): ShortcutHandler[] {
  return [...shortcuts];
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: ShortcutHandler): string {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }

  if (shortcut.shift) {
    parts.push('⇧');
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
}
