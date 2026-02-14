/**
 * Persistence layer for inventory data
 */

import { writable, derived, get } from 'svelte/store';
import { inventory } from './inventory';
import { chains } from './chains';
import { settings } from './settings';
import { saveFile, loadFile, loadFromHandle, verifyPermission, serializeInventory, deserializeInventory, storeFileHandle, retrieveFileHandle, clearFileHandle } from '../storage';
import { FILE_CONFIG, UI_MESSAGES } from '../constants';
import { fetchMissingDataBatch } from '../onchain';

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
 * Currently saving
 */
export const isSaving = writable<boolean>(false);

/**
 * Loading file flag (store to share state across hot-reload instances)
 */
const isLoadingFile = writable<boolean>(false);

/**
 * Mark inventory as dirty when changes occur
 * Note: Only marks dirty, does not auto-save
 */
inventory.subscribe(() => {
  // Don't mark dirty if we're currently loading a file
  if (get(isLoadingFile)) {
    return;
  }

  // Mark dirty if we have a file to save to
  if (get(lastSaved) !== null) {
    isDirty.set(true);
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

    isSaving.set(true);

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
  } finally {
    isSaving.set(false);
  }
}

/**
 * Save inventory immediately if there are unsaved changes
 */
export async function saveIfDirty(): Promise<void> {
  if (get(isDirty) && get(fileHandle)) {
    await saveInventory(false);
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

    // Set loading flag to prevent marking dirty during load
    isLoadingFile.set(true);

    try {
      // Update persistence state BEFORE loading data
      isDirty.set(false);
      lastSaved.set(null);

      // Load into stores
      inventory.load(data.contracts);
      chains.load(data.chains);
      settings.update(s => ({ ...s, ...data.settings }));

      // Update file state
      if (result.handle) {
        fileHandle.set(result.handle);
        fileName.set(result.handle.name);

        // Store handle in IndexedDB for persistence across refreshes
        await storeFileHandle(result.handle);
      } else {
        fileHandle.set(null);
        fileName.set('inventory.json');
      }

      // Mark as saved after loading
      lastSaved.set(Date.now());
    } finally {
      // Always clear loading flag
      isLoadingFile.set(false);
    }

    // Auto-fetch missing on-chain data in background
    // Note: This won't trigger saves because we save explicitly on user edits only
    fetchMissingDataBatch(
      get(inventory),
      (id, updates) => inventory.updateContract(id, updates)
    ).catch(err => console.error('Auto-fetch failed:', err));

    return true;
  } catch (error) {
    console.error('Failed to load inventory:', error);
    isLoadingFile.set(false);
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

    // Set loading flag to prevent marking dirty during load
    isLoadingFile.set(true);

    try {
      // Update persistence state BEFORE loading data
      isDirty.set(false);
      lastSaved.set(null);

      // Load into stores
      inventory.load(data.contracts);
      chains.load(data.chains);
      settings.update(s => ({ ...s, ...data.settings }));

      // Update file state
      fileHandle.set(handle);
      fileName.set(handle.name);
      lastSaved.set(Date.now());
    } finally {
      // Always clear loading flag
      isLoadingFile.set(false);
    }

    // Auto-fetch missing on-chain data in background
    fetchMissingDataBatch(
      get(inventory),
      (id, updates) => inventory.updateContract(id, updates)
    ).catch(err => console.error('Auto-fetch failed:', err));

    return true;
  } catch (error) {
    console.error('Failed to restore last file:', error);
    isLoadingFile.set(false);
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

  // CRITICAL: Clear file state BEFORE clearing inventory
  // This prevents marking the new empty inventory as dirty
  fileHandle.set(null);
  fileName.set(FILE_CONFIG.DEFAULT_NAME);
  isDirty.set(false);
  lastSaved.set(null);

  // Clear stored file handle
  await clearFileHandle();

  // Now safe to clear inventory (won't be marked as dirty)
  inventory.clear();
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
  [fileName, isDirty, isSaving],
  ([$fileName, $isDirty, $isSaving]) => {
    if ($isSaving) {
      return `${$fileName} (saving...)`;
    }
    return $isDirty ? `${$fileName} *` : $fileName;
  }
);
