<script lang="ts">
  import TopBar from './components/TopBar.svelte';
  import TagFilter from './components/TagFilter.svelte';
  import ContractTable from './components/ContractTable.svelte';
  import Drawer from './components/Drawer.svelte';
  import { inventory } from './lib/stores/inventory';
  import { isDirty, restoreLastFile } from './lib/stores/persistence';
  import { drawerOpen } from './lib/stores/selectedContract';
  import { handleKeydown } from './lib/keyboardShortcuts';
  import { onMount } from 'svelte';

  // Warn before leaving with unsaved changes
  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if ($isDirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  // Restore last opened file or add sample data
  onMount(async () => {
    // Try to restore last opened file
    const restored = await restoreLastFile();

    // If no file was restored and inventory is empty, add sample data
    if (!restored && $inventory.length === 0) {
      inventory.addContract({
        label: 'USDC Token',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chainId: 1,
        type: 'implementation',
        tags: ['token', 'stablecoin', 'production'],
        source: 'https://github.com/centre-tokens/centre-tokens',
      });

      inventory.addContract({
        label: 'Scroll Bridge Proxy',
        address: '0x6774Bcbd5ceCeF1336b5300fb5186a12DDD8b367',
        chainId: 534352,
        type: 'proxy',
        tags: ['bridge', 'infrastructure'],
        source: 'https://github.com/scroll-tech/scroll-contracts',
      });

      inventory.addContract({
        label: 'Uniswap V3 Router',
        address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        chainId: 1,
        type: 'implementation',
        tags: ['defi', 'router', 'production'],
        source: 'https://github.com/Uniswap/v3-periphery',
      });
    }
  });
</script>

<svelte:window on:keydown={handleKeydown} on:beforeunload={handleBeforeUnload} />

<div class="app-container">
  <div class="top-section" class:dimmed={$drawerOpen}>
    <TopBar />
    <TagFilter />
  </div>

  <div class="main-content">
    <ContractTable />
    <Drawer />
  </div>
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .top-section {
    position: relative;
    transition: filter 0.2s ease;
  }

  .top-section.dimmed {
    background: rgba(0, 0, 0, 0.2);
    filter: blur(2px);
    pointer-events: none;
  }

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }
</style>
