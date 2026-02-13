/**
 * Persistence layer for inventory data
 */

import { writable, derived, get } from 'svelte/store';
import { inventory } from './inventory';
import { chains } from './chains';
import { settings } from './settings';
import { saveFile, loadFile, loadFromHandle, verifyPermission } from '../storage/fileSystem';
import { serializeInventory, deserializeInventory } from '../storage/serialization';
import { storeFileHandle, retrieveFileHandle, clearFileHandle } from '../storage/handleStorage';
import { FILE_CONFIG, AUTO_SAVE, UI_MESSAGES } from '../constants';

/**
 * Current file handle (for File System Access API)
 */
export const fileHandle = writable<FileSystemFileHandle | null>(null);

/**
 * Current file name
 */
export const fileName = writable<string>(FILE_CONFIG.DEFAULT_NAME);

/**
 * Dirty state - true if there are unsaved changes
 */
export const isDirty = writable<boolean>(false);

/**
 * Last saved timestamp
 */
export const lastSaved = writable<number | null>(null);

/**
 * Auto-save enabled
 */
export const autoSaveEnabled = writable<boolean>(AUTO_SAVE.ENABLED_BY_DEFAULT);

/**
 * Currently auto-saving
 */
export const isAutoSaving = writable<boolean>(false);

let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Mark inventory as dirty when changes occur and trigger auto-save
 */
inventory.subscribe(() => {
  if (get(lastSaved) !== null) {
    isDirty.set(true);

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Schedule auto-save if enabled and we have a file handle
    if (get(autoSaveEnabled) && get(fileHandle)) {
      autoSaveTimeout = setTimeout(async () => {
        try {
          isAutoSaving.set(true);
          await saveInventory(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          isAutoSaving.set(false);
        }
      }, AUTO_SAVE.DEBOUNCE_MS);
    }
  }
});

/**
 * Save current inventory to file
 */
export async function saveInventory(saveAs: boolean = false): Promise<boolean> {
  try {
    const currentHandle = get(fileHandle);
    const currentFileName = get(fileName);

    // Serialize current state
    const json = serializeInventory(
      get(inventory),
      get(chains),
      get(settings)
    );

    // Save file
    const handle = await saveFile(
      json,
      currentFileName,
      saveAs ? undefined : currentHandle || undefined
    );

    if (handle) {
      // File System Access API succeeded
      fileHandle.set(handle);
      fileName.set(handle.name);
      isDirty.set(false);
      lastSaved.set(Date.now());

      // Store handle in IndexedDB for persistence across refreshes
      await storeFileHandle(handle);

      return true;
    } else if (!saveAs && !currentHandle) {
      // Download fallback succeeded (no handle returned)
      isDirty.set(false);
      lastSaved.set(Date.now());
      return true;
    }

    // User cancelled
    return false;
  } catch (error) {
    console.error('Failed to save inventory:', error);
    throw error;
  }
}

/**
 * Load inventory from file
 */
export async function loadInventory(): Promise<boolean> {
  try {
    const result = await loadFile();

    if (!result) {
      // User cancelled
      return false;
    }

    // Deserialize and validate
    const data = deserializeInventory(result.content);

    // Load into stores
    inventory.load(data.contracts);
    chains.load(data.chains);
    settings.update(s => ({ ...s, ...data.settings }));

    // Update persistence state
    if (result.handle) {
      fileHandle.set(result.handle);
      fileName.set(result.handle.name);

      // Store handle in IndexedDB for persistence across refreshes
      await storeFileHandle(result.handle);
    } else {
      fileHandle.set(null);
      fileName.set('inventory.json');
    }

    isDirty.set(false);
    lastSaved.set(Date.now());

    return true;
  } catch (error) {
    console.error('Failed to load inventory:', error);
    throw error;
  }
}

/**
 * Restore last opened file on app start
 */
export async function restoreLastFile(): Promise<boolean> {
  try {
    const handle = await retrieveFileHandle();

    if (!handle) {
      return false;
    }

    // Verify we still have permission
    const hasPermission = await verifyPermission(handle, false);
    if (!hasPermission) {
      // Permission denied or revoked - clear stored handle
      await clearFileHandle();
      return false;
    }

    // Load content from handle
    const content = await loadFromHandle(handle);
    if (!content) {
      return false;
    }

    // Deserialize and validate
    const data = deserializeInventory(content);

    // Load into stores
    inventory.load(data.contracts);
    chains.load(data.chains);
    settings.update(s => ({ ...s, ...data.settings }));

    // Update persistence state
    fileHandle.set(handle);
    fileName.set(handle.name);
    isDirty.set(false);
    lastSaved.set(Date.now());

    return true;
  } catch (error) {
    console.error('Failed to restore last file:', error);
    // Clear stored handle if we can't load it
    await clearFileHandle();
    return false;
  }
}

/**
 * Create new inventory (clears current data)
 */
export async function newInventory(): Promise<void> {
  if (get(isDirty)) {
    const confirmed = confirm(UI_MESSAGES.UNSAVED_CHANGES);
    if (!confirmed) return;
  }

  inventory.clear();
  fileHandle.set(null);
  fileName.set(FILE_CONFIG.DEFAULT_NAME);
  isDirty.set(false);
  lastSaved.set(null);

  // Clear stored file handle
  await clearFileHandle();
}

/**
 * Export inventory as JSON (download)
 */
export function exportInventory(): void {
  const json = serializeInventory(
    get(inventory),
    get(chains),
    get(settings)
  );

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = get(fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Derived store: Display name for current file
 */
export const displayFileName = derived(
  [fileName, isDirty, isAutoSaving],
  ([$fileName, $isDirty, $isAutoSaving]) => {
    if ($isAutoSaving) {
      return `${$fileName} (saving...)`;
    }
    return $isDirty ? `${$fileName} *` : $fileName;
  }
);
