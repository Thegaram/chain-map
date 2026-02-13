<script lang="ts">
  import { filters } from '../lib/stores/filters';
  import { settings } from '../lib/stores/settings';
  import { chains } from '../lib/stores/chains';
  import { saveInventory, loadInventory, isDirty } from '../lib/stores/persistence';
  import ContractFormModal from './ContractFormModal.svelte';
  import KeyboardHints from './KeyboardHints.svelte';
  import FileMenu from './FileMenu.svelte';
  import { registerShortcut, unregisterShortcut } from '../lib/keyboardShortcuts';
  import type { ShortcutHandler } from '../lib/keyboardShortcuts';
  import { SHORTCUTS, THEME_ICONS } from '../lib/constants';
  import { onMount } from 'svelte';

  let currentTheme: 'light' | 'dark' = 'light';
  let showAddModal = false;
  let searchInput: HTMLInputElement;

  function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    currentTheme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    settings.setTheme(newTheme);
  }

  function handleAddRecord() {
    showAddModal = true;
  }


  function handleSettings() {
    // Settings modal will be implemented later
    console.log('Settings');
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
          if ($isDirty) {
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
      }
    ];

    shortcuts.forEach(s => registerShortcut(s));

    return () => {
      shortcuts.forEach(s => unregisterShortcut(s));
    };
  });
</script>

<header class="top-bar">
  <div class="top-bar-section">
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
      {#each $chains as chain}
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

  <div class="top-bar-section actions">
    <FileMenu />

    <button class="action-btn" on:click={handleAddRecord} title="Add record (N)">
      +
    </button>

    <KeyboardHints />

    <button class="action-btn" on:click={handleSettings} title="Settings">
      ⚙
    </button>

    <button class="action-btn" on:click={toggleTheme} title="Toggle theme">
      {currentTheme === 'light' ? THEME_ICONS.LIGHT : THEME_ICONS.DARK}
    </button>
  </div>
</header>

<style>
  .top-bar {
    display: flex;
    align-items: center;
    gap: var(--space-lg);
    padding: var(--space-lg) var(--space-xl);
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
</style>

<ContractFormModal
  open={showAddModal}
  onClose={() => showAddModal = false}
/>
