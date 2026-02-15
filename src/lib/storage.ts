/**
 * Unified storage module: file system access, serialization, and IndexedDB
 */

import type { InventoryData, ContractRecord, ChainConfig, AppSettings } from './types';
import { EMPTY_INVENTORY } from './types';
import { FILE_CONFIG, DB_CONFIG, ERROR_MESSAGES } from './constants';

// ============================================================================
// Serialization
// ============================================================================

export function serializeInventory(
  contracts: ContractRecord[],
  chains: ChainConfig[],
  settings: AppSettings
): string {
  const data: InventoryData = {
    schemaVersion: FILE_CONFIG.SCHEMA_VERSION,
    settings,
    chains,
    contracts
  };
  // Custom replacer to handle BigInt values
  return JSON.stringify(
    data,
    (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    },
    2
  );
}

export function deserializeInventory(json: string): InventoryData {
  try {
    const data = JSON.parse(json) as InventoryData;

    // Validate
    if (!data.schemaVersion) {
      throw new Error(ERROR_MESSAGES.MISSING_SCHEMA);
    }
    if (data.schemaVersion !== FILE_CONFIG.SCHEMA_VERSION) {
      throw new Error(ERROR_MESSAGES.UNSUPPORTED_SCHEMA(data.schemaVersion));
    }
    if (!Array.isArray(data.contracts)) {
      throw new Error(ERROR_MESSAGES.INVALID_CONTRACTS);
    }
    if (!Array.isArray(data.chains)) {
      throw new Error(ERROR_MESSAGES.INVALID_CHAINS);
    }

    // Validate each contract
    data.contracts.forEach((contract, index) => {
      if (!contract.id || !contract.label || !contract.address) {
        throw new Error(ERROR_MESSAGES.INVALID_CONTRACT(index));
      }
    });

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(ERROR_MESSAGES.INVALID_JSON);
    }
    throw error;
  }
}

export function createEmptyInventory(): string {
  return serializeInventory(
    EMPTY_INVENTORY.contracts,
    EMPTY_INVENTORY.chains,
    EMPTY_INVENTORY.settings
  );
}

// ============================================================================
// File System Access API
// ============================================================================

function isFileSystemSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showSaveFilePicker' in window &&
    'showOpenFilePicker' in window
  );
}

export async function verifyPermission(
  handle: FileSystemFileHandle,
  readWrite: boolean = false
): Promise<boolean> {
  const options: FileSystemHandlePermissionDescriptor = {
    mode: readWrite ? 'readwrite' : 'read'
  };

  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }

  if ((await handle.requestPermission(options)) === 'granted') {
    return true;
  }

  return false;
}

export async function saveFile(
  content: string,
  fileName: string,
  fileHandle?: FileSystemFileHandle
): Promise<FileSystemFileHandle | null> {
  if (isFileSystemSupported()) {
    try {
      const handle =
        fileHandle ||
        (await window.showSaveFilePicker({
          suggestedName: fileName,
          types: FILE_CONFIG.FILE_TYPES
        }));

      // Request write permission for new handles
      if (!fileHandle) {
        const hasPermission = await verifyPermission(handle, true);
        if (!hasPermission) {
          throw new Error(ERROR_MESSAGES.WRITE_PERMISSION_DENIED);
        }
      }

      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();

      return handle;
    } catch (error: any) {
      if (error.name === 'AbortError') return null; // User cancelled
      throw error;
    }
  } else {
    // Fallback: download
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return null;
  }
}

export async function loadFile(): Promise<{
  content: string;
  handle?: FileSystemFileHandle;
} | null> {
  if (isFileSystemSupported()) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: FILE_CONFIG.FILE_TYPES,
        multiple: false
      });

      const hasPermission = await verifyPermission(handle, false);
      if (!hasPermission) {
        throw new Error(ERROR_MESSAGES.READ_PERMISSION_DENIED);
      }

      const file = await handle.getFile();
      const content = await file.text();

      return { content, handle };
    } catch (error: any) {
      if (error.name === 'AbortError') return null; // User cancelled
      throw error;
    }
  } else {
    // Fallback: file input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';

      input.onchange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        try {
          const content = await file.text();
          resolve({ content });
        } catch {
          resolve(null);
        }
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  }
}

export async function loadFromHandle(handle: FileSystemFileHandle): Promise<string | null> {
  try {
    const hasPermission = await verifyPermission(handle, false);
    if (!hasPermission) {
      throw new Error(ERROR_MESSAGES.READ_PERMISSION_DENIED);
    }

    const file = await handle.getFile();
    return await file.text();
  } catch (error) {
    console.error('Failed to load from handle:', error);
    throw error;
  }
}

// ============================================================================
// IndexedDB for File Handles and Source URLs
// ============================================================================

const { NAME: DB_NAME, STORE_NAME, HANDLE_KEY, URL_KEY, URL_TIMESTAMP_KEY } = DB_CONFIG;

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function storeFileHandle(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(handle, HANDLE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Failed to store file handle:', error);
  }
}

export async function retrieveFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const handle = await new Promise<FileSystemFileHandle | null>((resolve, reject) => {
      const request = store.get(HANDLE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return handle;
  } catch (error) {
    console.error('Failed to retrieve file handle:', error);
    return null;
  }
}

export async function clearFileHandle(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(HANDLE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Failed to clear file handle:', error);
  }
}

// ============================================================================
// IndexedDB for Source URLs
// ============================================================================

export async function storeSourceUrl(url: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const urlRequest = store.put(url, URL_KEY);
      const timestampRequest = store.put(Date.now(), URL_TIMESTAMP_KEY);

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) resolve();
      };

      urlRequest.onsuccess = checkComplete;
      timestampRequest.onsuccess = checkComplete;
      urlRequest.onerror = () => reject(urlRequest.error);
      timestampRequest.onerror = () => reject(timestampRequest.error);
    });

    db.close();
  } catch (error) {
    console.error('Failed to store source URL:', error);
  }
}

export async function retrieveSourceUrl(): Promise<string | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const url = await new Promise<string | null>((resolve, reject) => {
      const request = store.get(URL_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return url;
  } catch (error) {
    console.error('Failed to retrieve source URL:', error);
    return null;
  }
}

export async function clearSourceUrl(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const urlRequest = store.delete(URL_KEY);
      const timestampRequest = store.delete(URL_TIMESTAMP_KEY);

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) resolve();
      };

      urlRequest.onsuccess = checkComplete;
      timestampRequest.onsuccess = checkComplete;
      urlRequest.onerror = () => reject(urlRequest.error);
      timestampRequest.onerror = () => reject(timestampRequest.error);
    });

    db.close();
  } catch (error) {
    console.error('Failed to clear source URL:', error);
  }
}
