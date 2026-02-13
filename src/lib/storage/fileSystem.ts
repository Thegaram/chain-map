/**
 * File System Access API wrapper
 * With fallback to download/upload for unsupported browsers
 */

import { FILE_CONFIG, ERROR_MESSAGES } from '../constants';

export interface FileSystemSupport {
  supported: boolean;
  message?: string;
}

/**
 * Check if File System Access API is supported
 */
export function checkFileSystemSupport(): FileSystemSupport {
  if (typeof window === 'undefined') {
    return { supported: false, message: 'Not in browser environment' };
  }

  if (!('showSaveFilePicker' in window) || !('showOpenFilePicker' in window)) {
    return {
      supported: false,
      message: 'File System Access API not supported. Using download/upload fallback.'
    };
  }

  return { supported: true };
}

/**
 * Save text content to a file using File System Access API
 */
export async function saveFile(
  content: string,
  fileName: string,
  fileHandle?: FileSystemFileHandle
): Promise<FileSystemFileHandle | null> {
  const support = checkFileSystemSupport();

  if (support.supported) {
    try {
      // Use existing handle or get a new one
      const handle = fileHandle || await window.showSaveFilePicker({
        suggestedName: fileName,
        types: FILE_CONFIG.FILE_TYPES
      });

      // Request write permission immediately if this is a new handle
      if (!fileHandle) {
        const hasPermission = await verifyPermission(handle, true);
        if (!hasPermission) {
          throw new Error(ERROR_MESSAGES.WRITE_PERMISSION_DENIED);
        }
      }

      // Write to file
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();

      return handle;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled
        return null;
      }
      console.error('Failed to save file:', error);
      throw error;
    }
  } else {
    // Fallback: trigger download
    downloadFile(content, fileName);
    return null;
  }
}

/**
 * Load text content from a file using File System Access API
 */
export async function loadFile(): Promise<{ content: string; handle?: FileSystemFileHandle } | null> {
  const support = checkFileSystemSupport();

  if (support.supported) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: FILE_CONFIG.FILE_TYPES,
        multiple: false
      });

      // Request read permission immediately
      const hasPermission = await verifyPermission(handle, false);
      if (!hasPermission) {
        throw new Error(ERROR_MESSAGES.READ_PERMISSION_DENIED);
      }

      const file = await handle.getFile();
      const content = await file.text();

      return { content, handle };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled
        return null;
      }
      console.error('Failed to load file:', error);
      throw error;
    }
  } else {
    // Fallback: use file input
    return uploadFile();
  }
}

/**
 * Load content from an existing file handle
 */
export async function loadFromHandle(handle: FileSystemFileHandle): Promise<string | null> {
  try {
    // Request read permission
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

/**
 * Fallback: Download content as a file
 */
function downloadFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Fallback: Upload file via input element
 */
function uploadFile(): Promise<{ content: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) {
        resolve(null);
        return;
      }

      try {
        const content = await file.text();
        resolve({ content });
      } catch (error) {
        console.error('Failed to read file:', error);
        resolve(null);
      }
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}

/**
 * Check if we have permission to read/write a file handle
 */
export async function verifyPermission(
  handle: FileSystemFileHandle,
  readWrite: boolean = false
): Promise<boolean> {
  const options: FileSystemHandlePermissionDescriptor = {
    mode: readWrite ? 'readwrite' : 'read'
  };

  // Check if permission was already granted
  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }

  // Request permission
  if ((await handle.requestPermission(options)) === 'granted') {
    return true;
  }

  return false;
}
