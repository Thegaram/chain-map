<script lang="ts">
  import { sortedContracts, sort } from '../lib/stores/viewState';
  import type { SortField } from '../lib/stores/viewState';
  import { chainMap } from '../lib/stores/chains';
  import { openDrawer, selectedContractId } from '../lib/stores/ui';
  import { focusedContractId } from '../lib/stores/ui';
  import { inventory } from '../lib/stores/inventory';
  import { formatGitHubSource, getGitHubUrl, getExplorerAddressUrl } from '../lib/links';
  import { onMount, tick } from 'svelte';
  import ContextMenu from './ContextMenu.svelte';
  import type { MenuItem } from './ContextMenu.svelte';
  import type { ContractRecord } from '../lib/types';
  import { toast } from '../lib/stores/ui';
  import { saveIfDirty } from '../lib/stores/persistence';

  let rowElements: { [key: string]: HTMLTableRowElement } = {};

  // Context menu state
  let contextMenuVisible = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let contextMenuContract: ContractRecord | null = null;

  // Auto-scroll focused row into view
  $: if ($focusedContractId) {
    tick().then(() => {
      const rowElement = rowElements[$focusedContractId];
      if (rowElement) {
        rowElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  function shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function handleSort(field: SortField) {
    sort.toggleSort(field);
  }

  function getSortIcon(field: SortField): string {
    if ($sort.field !== field) return '';
    return $sort.direction === 'asc' ? '↑' : '↓';
  }

  function handleContextMenu(event: MouseEvent, contract: ContractRecord) {
    event.preventDefault();
    contextMenuContract = contract;
    contextMenuX = event.clientX;
    contextMenuY = event.clientY;
    contextMenuVisible = true;
  }

  async function handleContextMenuSelect(event: CustomEvent<string>) {
    const action = event.detail;
    if (!contextMenuContract) return;

    const contract = contextMenuContract;
    const chain = $chainMap.get(contract.chainId);

    switch (action) {
      case 'copy-address':
        navigator.clipboard.writeText(contract.address);
        toast.show('Address copied to clipboard');
        break;
      case 'open-explorer':
        const explorerUrl = getExplorerAddressUrl(contract.address, chain);
        if (explorerUrl) {
          window.open(explorerUrl, '_blank');
        }
        break;
      case 'duplicate':
        // Create a copy of the contract
        inventory.addContract({
          label: `${contract.label} (Copy)`,
          address: contract.address,
          chainId: contract.chainId,
          type: contract.type,
          tags: [...contract.tags],
          source: contract.source,
        });
        await saveIfDirty();
        break;
      case 'delete':
        if (confirm(`Delete "${contract.label}"?`)) {
          inventory.deleteContract(contract.id);
          await saveIfDirty();
        }
        break;
    }

    contextMenuVisible = false;
    contextMenuContract = null;
  }

  $: contextMenuItems = contextMenuContract ? [
    { label: 'Copy Address', icon: '📋', action: 'copy-address' },
    { label: 'Open in Explorer', icon: '🔗', action: 'open-explorer' },
    { divider: true, label: '', action: '' },
    { label: 'Duplicate', icon: '📄', action: 'duplicate' },
    { label: 'Delete', icon: '🗑️', action: 'delete', danger: true },
  ] as MenuItem[] : [];
</script>

<div class="table-container">
  <table class="contract-table">
    <thead>
      <tr>
        <th class="sortable" on:click={() => handleSort('label')}>
          Label {getSortIcon('label')}
        </th>
        <th class="sortable" on:click={() => handleSort('chain')}>
          Chain {getSortIcon('chain')}
        </th>
        <th>Address</th>
        <th>Source</th>
        <th>Tags</th>
      </tr>
    </thead>
    <tbody>
      {#each $sortedContracts as contract (contract.id)}
        {@const chain = $chainMap.get(contract.chainId)}
        {@const explorerUrl = getExplorerAddressUrl(contract.address, chain)}
        {@const githubUrl = contract.source ? getGitHubUrl(contract.source) : null}
        <tr
          class="contract-row"
          class:selected={$selectedContractId === contract.id}
          class:focused={$focusedContractId === contract.id}
          on:click={() => openDrawer(contract.id)}
          on:contextmenu={(e) => handleContextMenu(e, contract)}
          bind:this={rowElements[contract.id]}
        >
          <td class="label-cell">
            <span class="label-content">
              {contract.label}
              {#if contract.type === 'proxy'}
                <span class="proxy-badge" title="Proxy contract">⇄</span>
              {/if}
            </span>
          </td>
          <td>{chain?.shortName || `Chain ${contract.chainId}`}</td>
          <td class="address-cell">
            {#if explorerUrl}
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener"
                on:click|stopPropagation
                class="table-link"
              >
                {shortenAddress(contract.address)}
              </a>
            {:else}
              {shortenAddress(contract.address)}
            {/if}
          </td>
          <td class="source-cell">
            {#if githubUrl}
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener"
                on:click|stopPropagation
                class="table-link"
              >
                {formatGitHubSource(contract.source)}
              </a>
            {:else}
              {contract.source || '—'}
            {/if}
          </td>
          <td>
            <div class="tags">
              {#each contract.tags as tag}
                <span class="tag">{tag}</span>
              {/each}
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if $sortedContracts.length === 0}
    <div class="empty-state">
      <p>No contracts found</p>
      <p class="empty-hint">Press + to add a contract or adjust filters</p>
    </div>
  {/if}
</div>

<ContextMenu
  bind:visible={contextMenuVisible}
  x={contextMenuX}
  y={contextMenuY}
  items={contextMenuItems}
  on:select={handleContextMenuSelect}
/>

<style>
  .table-container {
    flex: 1;
    overflow: auto;
    background: var(--bg-primary);
  }

  .contract-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  thead {
    position: sticky;
    top: 0;
    background: var(--bg-secondary);
    z-index: 10;
  }

  th {
    text-align: left;
    padding: var(--space-sm) var(--space-md);
    font-weight: 600;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
    white-space: nowrap;
  }

  th.sortable {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.1s ease;
  }

  th.sortable:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .contract-row {
    cursor: pointer;
    transition: background-color 0.1s ease;
    border-bottom: 1px solid var(--border-color);
  }

  .contract-row:hover {
    background: var(--bg-secondary);
  }

  .contract-row.selected {
    background: var(--bg-secondary);
    border-left: 2px solid var(--accent);
  }

  .contract-row.selected:hover {
    background: var(--bg-tertiary);
  }

  .contract-row.focused {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .contract-row.focused.selected {
    /* When both focused and selected, show both indicators */
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  td {
    padding: var(--space-sm) var(--space-md);
    color: var(--text-primary);
  }

  .label-cell {
    font-weight: 500;
  }

  .label-content {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .proxy-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    color: var(--accent);
    font-weight: 600;
  }

  .address-cell {
    font-family: var(--font-mono);
    color: var(--text-secondary);
    font-size: 0.85rem;
  }

  .source-cell {
    color: var(--text-tertiary);
    font-size: 0.85rem;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .table-link {
    color: inherit;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .table-link:hover {
    color: var(--accent);
    text-decoration: underline;
  }

  .tags {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .tag {
    display: inline-block;
    padding: 2px 6px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 3px;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    color: var(--text-tertiary);
  }

  .empty-hint {
    font-size: var(--font-size-sm);
    margin-top: var(--space-sm);
  }
</style>
