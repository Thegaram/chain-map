<script lang="ts">
  import { sortedContracts, sort } from '../lib/stores/sort';
  import type { SortField } from '../lib/stores/sort';
  import { chainMap } from '../lib/stores/chains';
  import { openDrawer } from '../lib/stores/selectedContract';
  import { STATUS_ICONS } from '../lib/constants';
  import { formatGitHubSource, getGitHubUrl, getExplorerAddressUrl } from '../lib/links';

  function shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'verified': return STATUS_ICONS.VERIFIED;
      case 'unverified': return STATUS_ICONS.UNVERIFIED;
      case 'pending': return STATUS_ICONS.PENDING;
      case 'failed': return STATUS_ICONS.FAILED;
      default: return STATUS_ICONS.UNVERIFIED;
    }
  }

  function handleSort(field: SortField) {
    sort.toggleSort(field);
  }

  function getSortIcon(field: SortField): string {
    if ($sort.field !== field) return '';
    return $sort.direction === 'asc' ? '↑' : '↓';
  }
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
        <th class="sortable" on:click={() => handleSort('type')}>
          Type {getSortIcon('type')}
        </th>
        <th>Source</th>
        <th>Tags</th>
        <th class="sortable" on:click={() => handleSort('status')}>
          Status {getSortIcon('status')}
        </th>
      </tr>
    </thead>
    <tbody>
      {#each $sortedContracts as contract (contract.id)}
        {@const chain = $chainMap.get(contract.chainId)}
        {@const explorerUrl = getExplorerAddressUrl(contract.address, chain)}
        {@const githubUrl = contract.source ? getGitHubUrl(contract.source) : null}
        <tr class="contract-row" on:click={() => openDrawer(contract.id)}>
          <td class="label-cell">{contract.label}</td>
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
          <td class="type-cell">{contract.type}</td>
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
          <td class="status-cell">{getStatusIcon(contract.verificationStatus)}</td>
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

  td {
    padding: var(--space-md);
    color: var(--text-primary);
  }

  .label-cell {
    font-weight: 500;
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
