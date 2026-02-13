<script lang="ts">
  import {
    saveInventory,
    loadInventory,
    newInventory,
    exportInventory,
    displayFileName,
    isDirty,
    autoSaveEnabled,
    fileHandle
  } from '../lib/stores/persistence';
  import { checkFileSystemSupport } from '../lib/storage/fileSystem';
  import { AUTO_SAVE, UI_MESSAGES } from '../lib/constants';

  let showMenu = false;
  let isLoading = false;

  const fsSupport = checkFileSystemSupport();

  function toggleAutoSave() {
    autoSaveEnabled.update(v => !v);
  }

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function closeMenu() {
    showMenu = false;
  }

  async function handleNew() {
    closeMenu();
    newInventory();
  }

  async function handleOpen() {
    closeMenu();
    isLoading = true;
    try {
      const success = await loadInventory();
      if (success) {
        // Success feedback could be added here
      }
    } catch (error: any) {
      alert(`Failed to open file: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  async function handleSave() {
    closeMenu();
    if (!$isDirty) return;

    isLoading = true;
    try {
      await saveInventory(false);
    } catch (error: any) {
      alert(`Failed to save file: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  async function handleSaveAs() {
    closeMenu();
    isLoading = true;
    try {
      await saveInventory(true);
    } catch (error: any) {
      alert(`Failed to save file: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  function handleExport() {
    closeMenu();
    try {
      exportInventory();
    } catch (error: any) {
      alert(`Failed to export file: ${error.message}`);
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (showMenu && event.target instanceof HTMLElement) {
      const menu = document.querySelector('.file-menu-dropdown');
      const button = document.querySelector('.file-menu-button');
      if (menu && !menu.contains(event.target) && !button?.contains(event.target)) {
        closeMenu();
      }
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="file-menu">
  <button
    class="file-menu-button"
    class:active={showMenu}
    on:click={toggleMenu}
    disabled={isLoading}
  >
    <span class="menu-icon">⇅</span>
    <span class="file-name">{$displayFileName}</span>
  </button>

  {#if showMenu}
    <div class="file-menu-dropdown">
      <button class="menu-item" on:click={handleNew}>
        <span class="menu-item-icon">📄</span>
        <span class="menu-item-label">New</span>
        <span class="menu-item-hint">Clear inventory</span>
      </button>

      <button class="menu-item" on:click={handleOpen}>
        <span class="menu-item-icon">📂</span>
        <span class="menu-item-label">Open</span>
        <span class="menu-item-hint">Ctrl+O</span>
      </button>

      <div class="menu-divider"></div>

      <button
        class="menu-item"
        on:click={handleSave}
        disabled={!$isDirty}
      >
        <span class="menu-item-icon">💾</span>
        <span class="menu-item-label">Save</span>
        <span class="menu-item-hint">Ctrl+S</span>
      </button>

      <button class="menu-item" on:click={handleSaveAs}>
        <span class="menu-item-icon">💾</span>
        <span class="menu-item-label">Save As...</span>
        <span class="menu-item-hint">Ctrl+Shift+S</span>
      </button>

      <div class="menu-divider"></div>

      <button class="menu-item" on:click={handleExport}>
        <span class="menu-item-icon">⬇</span>
        <span class="menu-item-label">Export JSON</span>
        <span class="menu-item-hint">Download</span>
      </button>

      {#if fsSupport.supported && $fileHandle}
        <div class="menu-divider"></div>

        <button class="menu-item checkbox-item" on:click={toggleAutoSave}>
          <span class="menu-item-icon">{$autoSaveEnabled ? '☑' : '☐'}</span>
          <span class="menu-item-label">Auto-save</span>
          <span class="menu-item-hint">{AUTO_SAVE.DEBOUNCE_MS / 1000}s delay</span>
        </button>
      {/if}

      {#if !fsSupport.supported}
        <div class="menu-notice">
          {UI_MESSAGES.FALLBACK_MODE}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .file-menu {
    position: relative;
  }

  .file-menu-button {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-secondary);
    font-size: var(--font-size-sm);
    transition: all 0.15s ease;
    min-width: 180px;
  }

  .file-menu-button:hover:not(:disabled) {
    border-color: var(--border-hover);
    background: var(--bg-tertiary);
  }

  .file-menu-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .file-menu-button.active {
    background: var(--bg-tertiary);
    border-color: var(--accent);
  }

  .menu-icon {
    font-size: 1rem;
  }

  .file-name {
    flex: 1;
    text-align: left;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-menu-dropdown {
    position: absolute;
    top: calc(100% + var(--space-xs));
    left: 0;
    min-width: 240px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    padding: var(--space-xs);
    z-index: 100;
    animation: slideDown 0.15s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border-radius: 4px;
    text-align: left;
    transition: background 0.1s ease;
  }

  .menu-item:hover:not(:disabled) {
    background: var(--bg-secondary);
  }

  .menu-item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .menu-item-icon {
    font-size: 1rem;
  }

  .menu-item-label {
    flex: 1;
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }

  .menu-item-hint {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    font-family: var(--font-mono);
  }

  .menu-divider {
    height: 1px;
    background: var(--border-color);
    margin: var(--space-xs) 0;
  }

  .menu-notice {
    padding: var(--space-sm) var(--space-md);
    font-size: 0.75rem;
    color: var(--text-tertiary);
    text-align: center;
    border-top: 1px solid var(--border-color);
    margin-top: var(--space-xs);
  }

  .checkbox-item .menu-item-icon {
    font-size: 1.1rem;
  }
</style>
