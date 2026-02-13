<script lang="ts">
  import { filteredContracts } from '../lib/stores/filters';
  import { chainMap } from '../lib/stores/chains';
  import { openDrawer } from '../lib/stores/selectedContract';

  function shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function shortenHash(hash: string | undefined): string {
    if (!hash) return '—';
    return `${hash.slice(0, 10)}...`;
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'verified': return '✓';
      case 'unverified': return '?';
      case 'pending': return '⋯';
      case 'failed': return '✗';
      default: return '?';
    }
  }
</script>

<div class="table-container">
  <table class="contract-table">
    <thead>
      <tr>
        <th>Label</th>
        <th>Chain</th>
        <th>Address</th>
        <th>Type</th>
        <th>Codehash</th>
        <th>Source</th>
        <th>Tags</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {#each $filteredContracts as contract (contract.id)}
        <tr class="contract-row" on:click={() => openDrawer(contract.id)}>
          <td class="label-cell">{contract.label}</td>
          <td>{$chainMap.get(contract.chainId)?.shortName || `Chain ${contract.chainId}`}</td>
          <td class="address-cell">{shortenAddress(contract.address)}</td>
          <td class="type-cell">{contract.type}</td>
          <td class="hash-cell">{shortenHash(contract.expectedCodehash)}</td>
          <td class="source-cell">{contract.source || '—'}</td>
          <td>
            <div class="tags">
              {#each contract.tags as tag}
                <span class="tag">{tag}</span>
              {/each}
            </div>
          </td>
          <td class="status-cell">{getStatusIcon(contract.verificationStatus)}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if $filteredContracts.length === 0}
    <div class="empty-state">
      <p>No contracts found</p>
      <p class="empty-hint">Press + to add a contract or adjust filters</p>
    </div>
  {/if}
</div>

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
    padding: var(--space-md);
    font-weight: 600;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
    white-space: nowrap;
  }

  .contract-row {
    cursor: pointer;
    transition: background-color 0.1s ease;
    border-bottom: 1px solid var(--border-color);
  }

  .contract-row:hover {
    background: var(--bg-secondary);
  }

  td {
    padding: var(--space-md);
    color: var(--text-primary);
  }

  .label-cell {
    font-weight: 500;
  }

  .address-cell,
  .hash-cell {
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

  .status-cell {
    text-align: center;
    font-size: 1rem;
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
