<script lang="ts">
  import DetailsTab from './DetailsTab.svelte';
  import AbiTab from './AbiTab.svelte';
  import {
    drawerOpen,
    selectedContractId,
    activeTab,
    closeDrawer,
    setActiveTab,
    goBack,
    goForward,
    canGoBack,
    canGoForward
  } from '../lib/stores/ui';
  import { inventory } from '../lib/stores/inventory';
  import { UI_MESSAGES } from '../lib/constants';
  import { saveIfDirty } from '../lib/stores/persistence';
  import { onMount } from 'svelte';

  const MIN_WIDTH = 400;
  const MAX_WIDTH = 1200;
  const DEFAULT_WIDTH = 600;

  let drawerWidth = DEFAULT_WIDTH;
  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  // Load saved width from localStorage
  onMount(() => {
    const saved = localStorage.getItem('drawerWidth');
    if (saved) {
      const width = parseInt(saved);
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) {
        drawerWidth = width;
      }
    }
  });

  function handleTabChange(tab: 'details' | 'abi') {
    setActiveTab(tab);
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeDrawer();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeDrawer();
      return;
    }

    // Arrow key navigation between tabs
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActiveTab('details');
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActiveTab('abi');
      return;
    }
  }

  async function handleDelete() {
    if (!$selectedContractId) return;

    const contract = $inventory.find((c) => c.id === $selectedContractId);
    if (!contract) return;

    if (confirm(UI_MESSAGES.DELETE_CONFIRM(contract.label))) {
      inventory.deleteContract($selectedContractId);
      await saveIfDirty();
      closeDrawer();
    }
  }

  function handleResizeStart(event: MouseEvent) {
    isResizing = true;
    startX = event.clientX;
    startWidth = drawerWidth;
    event.preventDefault();
  }

  function handleResizeMove(event: MouseEvent) {
    if (!isResizing) return;

    const deltaX = startX - event.clientX;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + deltaX));
    drawerWidth = newWidth;
  }

  function handleResizeEnd() {
    if (isResizing) {
      isResizing = false;
      localStorage.setItem('drawerWidth', drawerWidth.toString());
    }
  }
</script>

<svelte:window
  on:keydown={handleKeydown}
  on:mousemove={handleResizeMove}
  on:mouseup={handleResizeEnd}
/>

{#if $drawerOpen}
  <div
    class="drawer-backdrop"
    role="button"
    tabindex="-1"
    on:click={handleBackdropClick}
    on:keydown={(e) => (e.key === 'Escape' ? closeDrawer() : null)}
  >
    <aside class="drawer" style="width: {drawerWidth}px;">
      <div
        class="resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize drawer"
        on:mousedown={handleResizeStart}
      ></div>
      <div class="drawer-header">
        <div class="header-left">
          <div class="nav-buttons">
            <button class="nav-btn" on:click={goBack} disabled={!$canGoBack} title="Go back">
              ←
            </button>
            <button
              class="nav-btn"
              on:click={goForward}
              disabled={!$canGoForward}
              title="Go forward"
            >
              →
            </button>
          </div>
          <div class="tabs" role="tablist">
            <button
              class="tab"
              class:active={$activeTab === 'details'}
              on:click={() => handleTabChange('details')}
              role="tab"
              aria-selected={$activeTab === 'details'}
              tabindex={$activeTab === 'details' ? 0 : -1}
            >
              Details
            </button>
            <button
              class="tab"
              class:active={$activeTab === 'abi'}
              on:click={() => handleTabChange('abi')}
              role="tab"
              aria-selected={$activeTab === 'abi'}
              tabindex={$activeTab === 'abi' ? 0 : -1}
            >
              ABI
            </button>
          </div>
        </div>

        <div class="header-actions">
          <button class="icon-btn delete-btn" on:click={handleDelete} title="Delete contract">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                d="M2 4h12M5.5 4V2.5h5V4M6.5 7v5M9.5 7v5M3.5 4l.5 9.5h8l.5-9.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button class="icon-btn close-btn" on:click={closeDrawer} title="Close (Esc)"> ✕ </button>
        </div>
      </div>

      <div class="drawer-content">
        {#if $activeTab === 'details'}
          <DetailsTab />
        {:else if $activeTab === 'abi'}
          <AbiTab />
        {/if}
      </div>
    </aside>
  </div>
{/if}

<style>
  .drawer-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    backdrop-filter: blur(2px);
    display: flex;
    justify-content: flex-end;
    z-index: 100;
  }

  .drawer {
    position: relative;
    max-width: 90vw;
    background: var(--bg-primary);
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-md);
  }

  .resize-handle {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 8px;
    cursor: ew-resize;
    z-index: 10;
    transition: background 0.15s ease;
  }

  .resize-handle:hover,
  .resize-handle:active {
    background: var(--accent);
    opacity: 0.3;
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .nav-buttons {
    display: flex;
    gap: 2px;
  }

  .nav-btn {
    padding: var(--space-xs) var(--space-sm);
    border-radius: 4px;
    color: var(--text-secondary);
    font-size: 1.1rem;
    line-height: 1;
    transition: all 0.15s ease;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-btn:hover:not(:disabled) {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .tabs {
    display: flex;
    gap: var(--space-xs);
  }

  .tab {
    padding: var(--space-sm) var(--space-md);
    border-radius: 4px;
    color: var(--text-secondary);
    transition: all 0.15s ease;
  }

  .tab:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .tab.active {
    background: var(--bg-primary);
    color: var(--text-primary);
    font-weight: 500;
  }

  .tab:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .header-actions {
    display: flex;
    gap: var(--space-xs);
  }

  .icon-btn {
    padding: var(--space-sm);
    border-radius: 4px;
    color: var(--text-secondary);
    font-size: 1.25rem;
    line-height: 1;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .delete-btn:hover {
    background: rgba(224, 49, 49, 0.1);
    color: #e03131;
  }

  .drawer-content {
    flex: 1;
    overflow: auto;
    padding: var(--space-md);
  }
</style>
