/**
 * Keyboard shortcuts manager
 */

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
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  ) {
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
