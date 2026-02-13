<script lang="ts">
  import { filters } from '../lib/stores/filters';
  import { settings } from '../lib/stores/settings';
  import { chains } from '../lib/stores/chains';
  import { inventory } from '../lib/stores/inventory';
  import { onMount } from 'svelte';

  let currentTheme: 'light' | 'dark' = 'light';

  function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    currentTheme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    settings.setTheme(newTheme);
  }

  function handleAddRecord() {
    // Add record logic will be implemented in Phase 2
    const label = prompt('Contract label:');
    if (!label) return;

    const address = prompt('Contract address:');
    if (!address) return;

    inventory.addContract({
      label,
      address,
      chainId: 1,
      type: 'implementation',
      tags: [],
      verificationStatus: 'unverified'
    });
  }

  function handleImportExport() {
    // Import/export logic will be implemented in Phase 3
    console.log('Import/Export - Phase 3');
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
  });
</script>

<header class="top-bar">
  <div class="top-bar-section">
    <input
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
    <button class="action-btn" on:click={handleAddRecord} title="Add record (N)">
      +
    </button>

    <button class="action-btn" on:click={handleImportExport} title="Import/Export">
      ⇅
    </button>

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
