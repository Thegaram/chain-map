<script lang="ts">
  import TopBar from './components/TopBar.svelte';
  import TagFilter from './components/TagFilter.svelte';
  import ContractTable from './components/ContractTable.svelte';
  import Drawer from './components/Drawer.svelte';
  import { inventory } from './lib/stores/inventory';
  import { handleKeydown } from './lib/keyboardShortcuts';
  import { onMount } from 'svelte';

  // Add some sample data on first load
  onMount(() => {
    if ($inventory.length === 0) {
      inventory.addContract({
        label: 'USDC Token',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chainId: 1,
        type: 'implementation',
        tags: ['token', 'stablecoin', 'production'],
        source: 'https://github.com/centre-tokens/centre-tokens',
        expectedCodehash: '0x1234567890abcdef...',
        verificationStatus: 'verified',
        notes: 'USDC stablecoin implementation on Ethereum mainnet'
      });

      inventory.addContract({
        label: 'Scroll Bridge Proxy',
        address: '0x6774Bcbd5ceCeF1336b5300fb5186a12DDD8b367',
        chainId: 534352,
        type: 'proxy',
        tags: ['bridge', 'infrastructure'],
        source: 'https://github.com/scroll-tech/scroll-contracts',
        verificationStatus: 'verified',
        notes: 'Main bridge proxy contract on Scroll'
      });

      inventory.addContract({
        label: 'Uniswap V3 Router',
        address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        chainId: 1,
        type: 'implementation',
        tags: ['defi', 'router', 'production'],
        source: 'https://github.com/Uniswap/v3-periphery',
        verificationStatus: 'verified',
        notes: 'Uniswap V3 SwapRouter contract'
      });
    }
  });
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="app-container">
  <TopBar />
  <TagFilter />

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

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }
</style>
