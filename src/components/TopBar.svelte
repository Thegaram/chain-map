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
        key: 'k',
        ctrl: true,
        handler: () => searchInput?.focus(),
        description: 'Focus search'
      },
      {
        key: 'n',
        handler: handleAddRecord,
        description: 'Add new contract'
      },
      {
        key: 's',
        ctrl: true,
        handler: async () => {
          if ($isDirty) {
            await saveInventory(false);
          }
        },
        description: 'Save inventory'
      },
      {
        key: 's',
        ctrl: true,
        shift: true,
        handler: async () => {
          await saveInventory(true);
        },
        description: 'Save as...'
      },
      {
        key: 'o',
        ctrl: true,
        handler: async () => {
          await loadInventory();
        },
        description: 'Open inventory'
      },
      {
        key: 'r',
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
      {currentTheme === 'light' ? '◐' : '◑'}
    </button>
  </div>
</header>

<style>
  .top-bar {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-primary);
    flex-shrink: 0;
  }

  .top-bar-section {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .top-bar-section.filters {
    flex: 1;
  }

  .search-input {
    min-width: 280px;
    padding: var(--space-sm) var(--space-md);
  }

  .filter-select {
    padding: var(--space-sm) var(--space-md);
    cursor: pointer;
  }

  .actions {
    display: flex;
    gap: var(--space-xs);
  }

  .action-btn {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-secondary);
    font-size: 1rem;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    border-color: var(--border-hover);
    background: var(--bg-tertiary);
  }

  .action-btn:active {
    transform: translateY(1px);
  }
</style>

<ContractFormModal
  open={showAddModal}
  onClose={() => showAddModal = false}
/>
