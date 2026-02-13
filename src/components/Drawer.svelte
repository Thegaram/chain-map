<script lang="ts">
  import DetailsTab from './DetailsTab.svelte';
  import OnChainTab from './OnChainTab.svelte';
  import AbiTab from './AbiTab.svelte';
  import { drawerOpen, selectedContractId, activeTab, closeDrawer } from '../lib/stores/selectedContract';

  function handleTabChange(tab: 'details' | 'onchain' | 'abi') {
    activeTab.set(tab);
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeDrawer();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeDrawer();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $drawerOpen}
  <div class="drawer-backdrop" on:click={handleBackdropClick} role="button" tabindex="-1">
    <aside class="drawer">
      <div class="drawer-header">
        <div class="tabs">
          <button
            class="tab"
            class:active={$activeTab === 'details'}
            on:click={() => handleTabChange('details')}
          >
            Details
          </button>
          <button
            class="tab"
            class:active={$activeTab === 'onchain'}
            on:click={() => handleTabChange('onchain')}
          >
            On-chain
          </button>
          <button
            class="tab"
            class:active={$activeTab === 'abi'}
            on:click={() => handleTabChange('abi')}
          >
            ABI
          </button>
        </div>

        <button class="close-btn" on:click={closeDrawer} title="Close (Esc)">
          ✕
        </button>
      </div>

      <div class="drawer-content">
        {#if $activeTab === 'details'}
          <DetailsTab />
        {:else if $activeTab === 'onchain'}
          <OnChainTab />
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
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: flex-end;
    z-index: 100;
  }

  .drawer {
    width: 600px;
    max-width: 90vw;
    background: var(--bg-primary);
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-md);
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
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

  .close-btn {
    padding: var(--space-sm);
    border-radius: 4px;
    color: var(--text-secondary);
    font-size: 1.25rem;
    line-height: 1;
  }

  .close-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .drawer-content {
    flex: 1;
    overflow: auto;
    padding: var(--space-lg);
  }
</style>
