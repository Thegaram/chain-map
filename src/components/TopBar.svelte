<script lang="ts">
  import { filters } from '../lib/stores/viewState';
  import { settings } from '../lib/stores/settings';
  import { chains } from '../lib/stores/chains';
  import { inventory } from '../lib/stores/inventory';
  import {
    saveInventory,
    loadInventory,
    isDirty,
    fileStatus,
    saveIfDirty,
    isReadOnly
  } from '../lib/stores/persistence';
  import {
    contractFormOpen,
    contractFormInitialAddress,
    openContractForm,
    closeContractForm
  } from '../lib/stores/ui';
  import ContractFormModal from './ContractFormModal.svelte';
  import ActionsMenu from './ActionsMenu.svelte';
  import { registerShortcut, unregisterShortcut } from '../lib/keyboardShortcuts';
  import type { ShortcutHandler } from '../lib/keyboardShortcuts';
  import { SHORTCUTS, THEME_ICONS } from '../lib/constants';
  import { onMount } from 'svelte';

  let currentTheme: 'light' | 'dark' = 'light';
  let searchInput: HTMLInputElement;

  function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    currentTheme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    settings.setTheme(newTheme);
  }

  function handleAddRecord() {
    openContractForm();
  }

  // Initialize theme on mount
  onMount(() => {
    const stored = localStorage.getItem('theme');
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    currentTheme = (stored as 'light' | 'dark') || system;
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Register keyboard shortcuts
    const shortcuts: ShortcutHandler[] = [
      {
        key: SHORTCUTS.SEARCH,
        ctrl: true,
        handler: () => searchInput?.focus(),
        description: 'Focus search'
      },
      {
        key: SHORTCUTS.NEW,
        handler: handleAddRecord,
        description: 'Add new contract'
      },
      {
        key: SHORTCUTS.SAVE,
        ctrl: true,
        handler: async () => {
          if ($isDirty && !$isReadOnly) {
            await saveInventory(false);
          }
        },
        description: 'Save inventory'
      },
      {
        key: SHORTCUTS.SAVE,
        ctrl: true,
        shift: true,
        handler: async () => {
          await saveInventory(true);
        },
        description: 'Save as...'
      },
      {
        key: SHORTCUTS.OPEN,
        ctrl: true,
        handler: async () => {
          await loadInventory();
        },
        description: 'Open inventory'
      },
      {
        key: SHORTCUTS.REFRESH,
        handler: () => console.log('Refresh RPC - Phase 4'),
        description: 'Refresh RPC data'
      },
      {
        key: 'z',
        ctrl: true,
        handler: async () => {
          inventory.undo();
          await saveIfDirty();
        },
        description: 'Undo'
      },
      {
        key: 'z',
        ctrl: true,
        shift: true,
        handler: async () => {
          inventory.redo();
          await saveIfDirty();
        },
        description: 'Redo'
      }
    ];

    shortcuts.forEach((s) => registerShortcut(s));

    return () => {
      shortcuts.forEach((s) => unregisterShortcut(s));
    };
  });
</script>

<header class="top-bar">
  <div class="top-bar-section">
    <h1 class="app-title">Chain Map</h1>
    <input
      bind:this={searchInput}
      type="text"
      class="search-input"
      placeholder="Search contracts... (⌘K)"
      bind:value={$filters.searchQuery}
      on:input={(e) => filters.setSearchQuery((e.target as HTMLInputElement).value)}
    />
  </div>

  <div class="top-bar-section filters">
    <select
      class="filter-select"
      value={$filters.selectedChain}
      on:change={(e) => {
        const val = (e.target as HTMLSelectElement).value;
        filters.setChain(val === 'all' ? 'all' : parseInt(val));
      }}
    >
      <option value="all">All Chains</option>
      {#each $chains as chain (chain.chainId)}
        <option value={chain.chainId}>{chain.shortName}</option>
      {/each}
    </select>

    <select
      class="filter-select"
      value={$filters.selectedType}
      on:change={(e) => {
        const val = (e.target as HTMLSelectElement).value;
        filters.setType(val as any);
      }}
    >
      <option value="all">All Types</option>
      <option value="implementation">Implementation</option>
      <option value="proxy">Proxy</option>
    </select>
  </div>

  <div class="top-bar-section file-status">
    <span class="file-name-bold">{$fileStatus.name}</span>
    {#if $fileStatus.status}
      <span class="file-status-text">{$fileStatus.status}</span>
    {/if}
    {#if $isDirty}
      <span class="unsaved-indicator" title="Unsaved changes">●</span>
    {/if}
  </div>

  <div class="top-bar-section actions">
    <ActionsMenu />

    <button class="action-btn" on:click={handleAddRecord} title="Add record (N)"> + </button>

    <button class="action-btn" on:click={toggleTheme} title="Toggle theme">
      {currentTheme === 'light' ? THEME_ICONS.LIGHT : THEME_ICONS.DARK}
    </button>
  </div>
</header>

<ContractFormModal
  open={$contractFormOpen}
  onClose={closeContractForm}
  initialAddress={$contractFormInitialAddress}
/>

<style>
  .top-bar {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--border-light);
    background: var(--bg-primary);
    flex-shrink: 0;
  }

  .top-bar-section {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .top-bar-section.filters {
    flex: 1;
  }

  .app-title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    user-select: none;
  }

  .search-input {
    min-width: 300px;
    padding: var(--space-sm) var(--space-lg);
    font-size: var(--font-size-sm);
    border-color: var(--border-light);
  }

  .search-input:focus {
    box-shadow: 0 0 0 3px var(--accent-light);
  }

  .filter-select {
    padding: var(--space-sm) var(--space-lg);
    font-size: var(--font-size-sm);
    cursor: pointer;
    border-color: var(--border-light);
    color: var(--text-secondary);
  }

  .filter-select:hover {
    border-color: var(--border-color);
  }

  .actions {
    display: flex;
    gap: var(--space-sm);
    align-items: center;
  }

  .action-btn {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--border-light);
    border-radius: 6px;
    background: transparent;
    font-size: 0.95rem;
    color: var(--text-secondary);
  }

  .action-btn:hover {
    border-color: var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .filter-select:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .action-btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .file-status {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--text-tertiary);
    font-size: var(--font-size-xs);
  }

  .file-name-bold {
    opacity: 0.7;
    font-weight: 600;
  }

  .file-status-text {
    opacity: 0.7;
    font-weight: 400;
    margin-left: var(--space-xs);
  }

  .unsaved-indicator {
    color: var(--accent);
    font-size: 0.5rem;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>
