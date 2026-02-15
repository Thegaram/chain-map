/**
 * Persistence layer for inventory data
 */

import { writable, derived, get } from 'svelte/store';
import { inventory } from './inventory';
import { chains } from './chains';
import { settings } from './settings';
import { saveFile, loadFile, loadFromHandle, verifyPermission, serializeInventory, deserializeInventory, storeFileHandle, retrieveFileHandle, clearFileHandle, storeSourceUrl, retrieveSourceUrl, clearSourceUrl } from '../storage';
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
 * Source URL (for read-only remote inventories)
 */
export const sourceUrl = writable<string | null>(null);

/**
 * Read-only mode - true when inventory was loaded from URL
 */
export const isReadOnly = derived(sourceUrl, ($sourceUrl) => $sourceUrl !== null);

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
    const currentSourceUrl = get(sourceUrl);

    // Prevent regular save in read-only mode
    if (!saveAs && currentSourceUrl !== null) {
      throw new Error('Cannot save to URL. Use Save As to create a local copy.');
    }

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

      // Exit read-only mode when doing Save As
      if (saveAs && currentSourceUrl !== null) {
        sourceUrl.set(null);
        await clearSourceUrl();
      }

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
  // Don't auto-save in read-only mode
  if (get(isDirty) && get(fileHandle) && get(sourceUrl) === null) {
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

      // Clear read-only mode (loading local file)
      sourceUrl.set(null);
      await clearSourceUrl();

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
 * Load inventory from URL (read-only mode)
 */
export async function loadInventoryFromUrl(url: string): Promise<void> {
  // Validate HTTPS (allow HTTP for localhost/127.0.0.1)
  const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    throw new Error('URL must use HTTP or HTTPS protocol');
  }
  if (!isLocalhost && !url.startsWith('https://')) {
    throw new Error('Remote URLs must use HTTPS protocol');
  }

  // Fetch with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();

    // Deserialize and validate
    const data = deserializeInventory(content);

    // Set loading flag to prevent marking dirty during load
    isLoadingFile.set(true);

    try {
      // Clear file handle (we're loading from URL now)
      await clearFileHandle();

      // Update persistence state BEFORE loading data
      isDirty.set(false);
      lastSaved.set(null);

      // Load into stores
      inventory.load(data.contracts);
      chains.load(data.chains);
      settings.update(s => ({ ...s, ...data.settings }));

      // Extract filename from URL
      const urlPath = new URL(url).pathname;
      const extractedFileName = urlPath.split('/').pop() || 'inventory.json';

      // Set read-only mode
      fileHandle.set(null);
      fileName.set(extractedFileName);
      sourceUrl.set(url);

      // Store URL in IndexedDB for session persistence
      await storeSourceUrl(url);

      // Mark as loaded
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
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle specific error types
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Check the URL and try again.');
    }
    if (error.message?.includes('Failed to fetch') || error.message?.includes('CORS')) {
      throw new Error('URL blocked by CORS policy. Use a CORS-enabled endpoint.');
    }

    // Re-throw other errors
    throw error;
  } finally {
    isLoadingFile.set(false);
  }
}

/**
 * Restore last opened file on app start
 */
export async function restoreLastFile(): Promise<boolean> {
  try {
    // Check for stored URL first
    const storedUrl = await retrieveSourceUrl();
    if (storedUrl) {
      try {
        await loadInventoryFromUrl(storedUrl);
        return true;
      } catch (error) {
        console.error('Failed to restore from URL, clearing:', error);
        await clearSourceUrl();
        // Fall through to try file handle
      }
    }

    // Fall back to file handle restoration
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
  sourceUrl.set(null);

  // Clear stored file handle and URL
  await clearFileHandle();
  await clearSourceUrl();

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
  [fileName, isSaving, isReadOnly, fileHandle],
  ([$fileName, $isSaving, $isReadOnly, $fileHandle]) => {
    if ($isSaving) {
      return `${$fileName} (saving...)`;
    }

    if ($isReadOnly) {
      return `${$fileName} (remote file, read-only)`;
    }

    if ($fileHandle) {
      return `${$fileName} (local file, read-write)`;
    }

    // No file loaded yet
    return $fileName;
  }
);

/**
 * Derived store: File status parts (name and status separately for styling)
 */
export const fileStatus = derived(
  [fileName, isSaving, isReadOnly, fileHandle],
  ([$fileName, $isSaving, $isReadOnly, $fileHandle]) => {
    if ($isSaving) {
      return { name: $fileName, status: '(saving...)' };
    }

    if ($isReadOnly) {
      return { name: $fileName, status: '(remote file, read-only)' };
    }

    if ($fileHandle) {
      return { name: $fileName, status: '(local file, read-write)' };
    }

    // No file loaded yet
    return { name: $fileName, status: null };
  }
);
