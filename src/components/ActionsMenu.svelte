<script lang="ts">
  import { saveInventory, loadInventory, newInventory, isDirty } from '../lib/stores/persistence';
  import { toast } from '../lib/stores/ui';
  import KeyboardHints from './KeyboardHints.svelte';
  import LoadFromUrlModal from './LoadFromUrlModal.svelte';

  let showMenu = false;
  let showKeyboardHints = false;
  let showUrlModal = false;
  let isLoading = false;

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function closeMenu() {
    showMenu = false;
  }

  function handleClickOutside(event: MouseEvent) {
    if (showMenu) {
      closeMenu();
    }
  }

  async function handleNewInventory() {
    closeMenu();
    newInventory();
  }

  async function handleOpen() {
    closeMenu();
    isLoading = true;
    try {
      await loadInventory();
    } catch (error: any) {
      toast.show(`Failed to open: ${error.message}`, 'error');
    } finally {
      isLoading = false;
    }
  }

  function handleOpenFromUrl() {
    closeMenu();
    showUrlModal = true;
  }

  async function handleSave() {
    if (!$isDirty) {
      closeMenu();
      return;
    }

    closeMenu();
    isLoading = true;
    try {
      await saveInventory(false);
    } catch (error: any) {
      toast.show(`Failed to save: ${error.message}`, 'error');
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
      toast.show(`Failed to save: ${error.message}`, 'error');
    } finally {
      isLoading = false;
    }
  }

  function handleShowKeyboardHints() {
    showKeyboardHints = true;
    closeMenu();
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="actions-menu-container">
  <button class="menu-trigger" on:click|stopPropagation={toggleMenu} title="Actions menu">
    ⋮
  </button>

  {#if showMenu}
    <div class="menu-dropdown" on:click|stopPropagation>
      <button class="menu-item" on:click={handleNewInventory}>
        <span>New</span>
      </button>
      <button class="menu-item" on:click={handleOpen}>
        <span>Open...</span>
        <span class="shortcut">⌘O</span>
      </button>
      <button class="menu-item" on:click={handleOpenFromUrl}>
        <span>Open from URL...</span>
      </button>
      <button class="menu-item" on:click={handleSave} disabled={!$isDirty}>
        <span>Save</span>
        <span class="shortcut">⌘S</span>
      </button>
      <button class="menu-item" on:click={handleSaveAs}>
        <span>Save As...</span>
        <span class="shortcut">⌘⇧S</span>
      </button>

      <div class="divider"></div>
      <button class="menu-item" on:click={handleShowKeyboardHints}>
        <span>Keyboard Shortcuts</span>
        <span class="shortcut">?</span>
      </button>
    </div>
  {/if}
</div>

<KeyboardHints bind:open={showKeyboardHints} />
<LoadFromUrlModal open={showUrlModal} onClose={() => (showUrlModal = false)} />

<style>
  .actions-menu-container {
    position: relative;
  }

  .menu-trigger {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--border-light);
    border-radius: 6px;
    background: transparent;
    font-size: 1.2rem;
    color: var(--text-secondary);
    line-height: 1;
    transition: all 0.15s ease;
  }

  .menu-trigger:hover {
    border-color: var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .menu-trigger:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .menu-dropdown {
    position: absolute;
    top: calc(100% + var(--space-xs));
    right: 0;
    min-width: 220px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    box-shadow: var(--shadow-lg);
    padding: var(--space-xs);
    z-index: 1000;
    animation: fadeIn 0.1s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
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
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
    border-radius: 4px;
    text-align: left;
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    transition: background 0.1s ease;
  }

  .menu-item:hover:not(:disabled) {
    background: var(--bg-secondary);
  }

  .menu-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .shortcut {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    margin-left: var(--space-md);
  }

  .divider {
    height: 1px;
    background: var(--border-color);
    margin: var(--space-xs) 0;
  }
</style>
