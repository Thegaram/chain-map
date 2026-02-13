<script lang="ts">
  import DetailsTab from './DetailsTab.svelte';
  import AbiTab from './AbiTab.svelte';
  import { drawerOpen, selectedContractId, activeTab, closeDrawer } from '../lib/stores/selectedContract';
  import { inventory } from '../lib/stores/inventory';
  import { UI_MESSAGES } from '../lib/constants';

  function handleTabChange(tab: 'details' | 'abi') {
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

  function handleDelete() {
    if (!$selectedContractId) return;

    const contract = $inventory.find(c => c.id === $selectedContractId);
    if (!contract) return;

    if (confirm(UI_MESSAGES.DELETE_CONFIRM(contract.label))) {
      inventory.deleteContract($selectedContractId);
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
            class:active={$activeTab === 'abi'}
            on:click={() => handleTabChange('abi')}
          >
            ABI
          </button>
        </div>

        <div class="header-actions">
          <button class="icon-btn delete-btn" on:click={handleDelete} title="Delete contract">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 4h12M5.5 4V2.5h5V4M6.5 7v5M9.5 7v5M3.5 4l.5 9.5h8l.5-9.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="icon-btn close-btn" on:click={closeDrawer} title="Close (Esc)">
            ✕
          </button>
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
    padding: var(--space-lg);
  }
</style>
