<script lang="ts">
  import { filters } from '../lib/stores/filters';
  import { settings } from '../lib/stores/settings';
  import { chains } from '../lib/stores/chains';
  import { inventory } from '../lib/stores/inventory';
  import { saveInventory, loadInventory, isDirty } from '../lib/stores/persistence';
  import { getBytecodeInfo } from '../lib/chain/bytecode';
  import { toast } from '../lib/stores/toast';
  import ContractFormModal from './ContractFormModal.svelte';
  import KeyboardHints from './KeyboardHints.svelte';
  import FileMenu from './FileMenu.svelte';
  import { registerShortcut, unregisterShortcut } from '../lib/keyboardShortcuts';
  import type { ShortcutHandler } from '../lib/keyboardShortcuts';
  import { SHORTCUTS, THEME_ICONS } from '../lib/constants';
  import { onMount } from 'svelte';
  import type { Address } from 'viem';

  let currentTheme: 'light' | 'dark' = 'light';
  let showAddModal = false;
  let searchInput: HTMLInputElement;
  let bulkRefreshing = false;

  $: contractsWithoutCodehash = $inventory.filter(c => !c.codehash).length;

  function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    currentTheme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    settings.setTheme(newTheme);
  }

  function handleAddRecord() {
    showAddModal = true;
  }

  async function handleBulkRefreshCodehash() {
    const contractsToRefresh = $inventory.filter(c => !c.codehash);

    if (contractsToRefresh.length === 0) {
      toast.show('All contracts already have codehashes', 'info');
      return;
    }

    if (!confirm(`Refresh codehash for ${contractsToRefresh.length} contracts?`)) {
      return;
    }

    bulkRefreshing = true;
    let successCount = 0;
    let errorCount = 0;

    for (const contract of contractsToRefresh) {
      try {
        const bytecodeInfo = await getBytecodeInfo(
          contract.address as Address,
          contract.chainId
        );

        if (!bytecodeInfo.isEmpty) {
          inventory.updateContract(contract.id, {
            codehash: bytecodeInfo.codehash,
            bytecodeSize: bytecodeInfo.size
          });
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to fetch codehash for ${contract.label}:`, err);
        errorCount++;
      }
    }

    bulkRefreshing = false;

    if (errorCount > 0) {
      toast.show(`Refreshed ${successCount} codehashes, ${errorCount} failed`, 'info');
    } else {
      toast.show(`Successfully refreshed ${successCount} codehashes`);
    }
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
      },
      {
        key: 'z',
        ctrl: true,
        handler: () => {
          inventory.undo();
        },
        description: 'Undo'
      },
      {
        key: 'z',
        ctrl: true,
        shift: true,
        handler: () => {
          inventory.redo();
        },
        description: 'Redo'
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

    {#if contractsWithoutCodehash > 0}
      <button
        class="action-btn"
        on:click={handleBulkRefreshCodehash}
        disabled={bulkRefreshing}
        title="Refresh codehash for {contractsWithoutCodehash} contracts"
      >
        {#if bulkRefreshing}
          <span class="spinner-small"></span>
        {:else}
          ↻ {contractsWithoutCodehash}
        {/if}
      </button>
    {/if}

    <button class="action-btn" on:click={handleAddRecord} title="Add record (N)">
      +
    </button>

    <KeyboardHints />

    <button class="action-btn" on:click={toggleTheme} title="Toggle theme">
      {currentTheme === 'light' ? THEME_ICONS.LIGHT : THEME_ICONS.DARK}
    </button>
  </div>
</header>

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

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner-small {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid var(--border-color);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>

<ContractFormModal
  open={showAddModal}
  onClose={() => showAddModal = false}
/>
