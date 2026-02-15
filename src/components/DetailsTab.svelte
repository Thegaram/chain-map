<script lang="ts">
  import { inventory } from '../lib/stores/inventory';
  import { selectedContractId, closeDrawer, openDrawer, openContractForm } from '../lib/stores/ui';
  import { chains, chainMap } from '../lib/stores/chains';
  import { parseTags } from '../lib/validation';
  import { UI_MESSAGES } from '../lib/constants';
  import { getBytecodeInfo, formatBytecodeSize } from '../lib/onchain';
  import { detectProxy, formatProxyType } from '../lib/onchain';
  import { getExplorerAddressUrl } from '../lib/links';
  import type { ContractType, ContractRecord } from '../lib/types';
  import type { Address } from 'viem';
  import { onMount, tick } from 'svelte';
  import { toast } from '../lib/stores/ui';
  import Skeleton from './Skeleton.svelte';
  import { saveIfDirty } from '../lib/stores/persistence';
  import { createAddressLink, formatAddress } from '../lib/addressLink';

  // Make contract reactive to inventory changes
  let contract: ContractRecord | null = null;
  $: if ($selectedContractId) {
    contract = $inventory.find((c) => c.id === $selectedContractId) || null;
  } else {
    contract = null;
  }
  $: chain = contract ? $chainMap.get(contract.chainId) : null;

  let editedLabel = '';
  let editedChainId = 1;
  let editedType: ContractType = 'implementation';
  let editedTags = '';
  let editedSource = '';

  let loadingBytecode = false;
  let loadingProxy = false;
  let error: string | null = null;
  let savedField: string | null = null;
  let labelInput: HTMLInputElement;

  $: if (contract) {
    editedLabel = contract.label;
    editedChainId = contract.chainId;
    editedType = contract.type;
    editedTags = contract.tags.join(', ');
    editedSource = contract.source || '';

    // Auto-focus first input when contract changes
    tick().then(() => {
      labelInput?.focus();
      labelInput?.select();
    });
  }

  function showSavedIndicator(field: string) {
    savedField = field;
    setTimeout(() => {
      savedField = null;
    }, 2000);
  }

  async function saveField(
    field: string,
    updates: Partial<Omit<ContractRecord, 'id' | 'createdAt'>>
  ) {
    if (!contract) return;
    inventory.updateContract(contract.id, updates);
    await saveIfDirty();
    showSavedIndicator(field);
  }

  function handleLabelBlur() {
    if (!contract || editedLabel === contract.label) return;
    saveField('label', { label: editedLabel });
  }

  function handleChainChange() {
    if (!contract || editedChainId === contract.chainId) return;
    saveField('chain', { chainId: editedChainId });
  }

  function handleTypeChange() {
    if (!contract || editedType === contract.type) return;
    saveField('type', { type: editedType });
  }

  function handleTagsBlur() {
    if (!contract) return;
    const newTags = parseTags(editedTags);
    const oldTags = contract.tags.join(', ');
    if (editedTags === oldTags) return;
    saveField('tags', { tags: newTags });
  }

  function handleSourceBlur() {
    if (!contract) return;
    const newSource = editedSource.trim() || undefined;
    if (newSource === contract.source) return;
    saveField('source', { source: newSource });
  }

  function handleImplementationClick() {
    if (!contract?.implementation) return;

    const link = createAddressLink(contract.implementation, $inventory, chain);
    if (link.type === 'inventory' && link.contractId) {
      openDrawer(link.contractId);
    }
  }

  async function fetchBytecode() {
    if (!contract) return;

    loadingBytecode = true;
    error = null;

    try {
      const bytecodeInfo = await getBytecodeInfo(contract.address as Address, contract.chainId);

      if (bytecodeInfo.isEmpty) {
        error = 'No bytecode found at this address';
        return;
      }

      // Save to contract record
      inventory.updateContract(contract.id, {
        codehash: bytecodeInfo.codehash,
        bytecodeSize: bytecodeInfo.size
      });
      await saveIfDirty();
    } catch (err: any) {
      error = err.message || 'Failed to fetch bytecode';
    } finally {
      loadingBytecode = false;
    }
  }

  async function fetchProxy() {
    if (!contract) return;

    loadingProxy = true;

    try {
      const proxyInfo = await detectProxy(contract.address as Address, contract.chainId);

      // Auto-detect type based on proxy detection
      const detectedType: ContractType = proxyInfo.isProxy ? 'proxy' : 'implementation';

      // Save to contract record
      inventory.updateContract(contract.id, {
        type: detectedType,
        proxyType: proxyInfo.type,
        implementation: proxyInfo.implementation || undefined
      });
      await saveIfDirty();
    } catch (err: any) {
      console.error('Failed to fetch proxy info:', err);
    } finally {
      loadingProxy = false;
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.show(`${label} copied to clipboard`);
  }
</script>

{#if contract}
  <div class="details-tab">
    <div class="field-group">
      <div class="label-with-indicator">
        <label for="label">Label</label>
        {#if savedField === 'label'}
          <span class="saved-indicator">✓</span>
        {/if}
      </div>
      <input
        id="label"
        type="text"
        bind:value={editedLabel}
        on:blur={handleLabelBlur}
        bind:this={labelInput}
      />
    </div>

    <div class="field-group">
      <label for="address">Address</label>
      <input
        id="address"
        type="text"
        value={contract.address}
        readonly
        class="clickable-copy"
        on:click={() => copyToClipboard(contract.address, 'Address')}
        title="Click to copy"
      />
    </div>

    <div class="field-group">
      <div class="label-with-indicator">
        <label for="chain">Chain</label>
        {#if savedField === 'chain'}
          <span class="saved-indicator">✓</span>
        {/if}
      </div>
      <select id="chain" bind:value={editedChainId} on:change={handleChainChange}>
        {#each $chains as chain}
          <option value={chain.chainId}>{chain.name}</option>
        {/each}
      </select>
    </div>

    <div class="field-group">
      <div class="label-with-indicator">
        <label for="tags">Tags (comma separated)</label>
        {#if savedField === 'tags'}
          <span class="saved-indicator">✓</span>
        {/if}
      </div>
      <input id="tags" type="text" bind:value={editedTags} on:blur={handleTagsBlur} />
    </div>

    <div class="field-group">
      <div class="label-with-indicator">
        <label for="source">Source Repository (paste GitHub URL or use owner/repo@ref)</label>
        {#if savedField === 'source'}
          <span class="saved-indicator">✓</span>
        {/if}
      </div>
      <input
        id="source"
        type="text"
        bind:value={editedSource}
        on:blur={handleSourceBlur}
        placeholder="e.g., scroll-tech/scroll-contracts@v4.0.0 or full GitHub URL"
      />
    </div>

    <div class="divider"></div>

    <!-- On-Chain Data Section -->
    {#if error}
      <div class="error-banner">
        <span class="error-message">⚠ {error}</span>
      </div>
    {/if}

    <div class="section">
      <h3>Runtime Bytecode</h3>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-header">
            <span class="info-label">Codehash</span>
            <button
              class="refresh-btn"
              on:click={fetchBytecode}
              disabled={loadingBytecode}
              title="Refresh bytecode data"
            >
              ↻
            </button>
          </div>
          {#if loadingBytecode}
            <Skeleton width="100%" height="1.2rem" />
          {:else if contract.codehash}
            <code
              class="info-value clickable"
              on:click={() => copyToClipboard(contract.codehash!, 'Codehash')}
              title="Click to copy"
            >
              {contract.codehash}
            </code>
          {:else}
            <span class="info-value empty">—</span>
          {/if}
        </div>
        <div class="info-item">
          <div class="info-header">
            <span class="info-label">Size</span>
          </div>
          {#if loadingBytecode}
            <Skeleton width="80px" height="1.2rem" />
          {:else if contract.bytecodeSize !== undefined}
            <span class="info-value">{formatBytecodeSize(contract.bytecodeSize)}</span>
          {:else}
            <span class="info-value empty">—</span>
          {/if}
        </div>
      </div>
    </div>

    <div class="section">
      <h3>Proxy Detection</h3>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-header">
            <span class="info-label">Type</span>
            <button
              class="refresh-btn"
              on:click={fetchProxy}
              disabled={loadingProxy}
              title="Refresh proxy data"
            >
              ↻
            </button>
          </div>
          {#if loadingProxy}
            <Skeleton width="120px" height="1.2rem" />
          {:else if contract.proxyType}
            <span class="info-value">{formatProxyType(contract.proxyType)}</span>
          {:else}
            <span class="info-value empty">—</span>
          {/if}
        </div>
        {#if loadingProxy}
          <div class="info-item">
            <div class="info-header">
              <span class="info-label">Implementation</span>
            </div>
            <Skeleton width="100%" height="1.2rem" />
          </div>
        {:else if contract.implementation}
          {@const link = createAddressLink(contract.implementation, $inventory, chain)}
          <div class="info-item">
            <div class="info-header">
              <span class="info-label">Implementation</span>
            </div>
            {#if link.type === 'inventory'}
              <div>
                <button
                  class="implementation-link"
                  on:click={handleImplementationClick}
                  title="Open {link.label}"
                >
                  {contract.implementation} → {link.label}
                </button>
              </div>
            {:else}
              <div class="implementation-with-add">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener"
                  class="implementation-link explorer-link"
                  title="View on explorer"
                >
                  {contract.implementation} ↗
                </a>
                <button
                  class="add-btn-impl"
                  on:click={() => {
                    closeDrawer();
                    setTimeout(() => openContractForm(contract.implementation), 100);
                  }}
                  title="Add to inventory"
                >
                  +
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    {#if chain?.explorerUrl}
      {@const explorerUrl = getExplorerAddressUrl(contract.address, chain)}
      <div class="section">
        <h3>Explorer</h3>
        <a href={explorerUrl} target="_blank" rel="noopener" class="explorer-link">
          View on {chain?.shortName} Explorer →
        </a>
      </div>
    {/if}
  </div>
{:else}
  <div class="empty-state">
    <p>No contract selected</p>
  </div>
{/if}

<style>
  .details-tab {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  label {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .label-with-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .saved-indicator {
    color: #2f9e44;
    font-size: var(--font-size-sm);
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  input[readonly] {
    opacity: 0.6;
    cursor: default;
  }

  input,
  select {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-sm);
  }

  input:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  a:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 2px;
  }

  .clickable,
  .clickable-copy {
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .clickable:hover,
  .clickable-copy:hover {
    color: var(--accent);
  }

  .divider {
    height: 1px;
    background: var(--border-color);
    margin: var(--space-sm) 0;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  h3 {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-secondary);
  }

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .info-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .info-label {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .info-value {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }

  .info-value.empty {
    color: var(--text-tertiary);
  }

  code {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--text-secondary);
    word-break: break-all;
  }

  .refresh-btn {
    padding: 2px 4px;
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    transition: color 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .refresh-btn:hover:not(:disabled) {
    color: var(--accent);
  }

  .refresh-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .explorer-link {
    color: var(--accent);
    text-decoration: none;
    font-size: var(--font-size-sm);
    transition: color 0.15s ease;
  }

  .explorer-link:hover {
    color: var(--accent-hover);
    text-decoration: underline;
  }

  .implementation-link {
    background: none;
    border: none;
    padding: 0;
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.15s ease;
    text-align: left;
  }

  .implementation-link:hover {
    color: var(--accent-hover);
    text-decoration: underline;
  }

  .error-banner {
    padding: var(--space-md);
    background: rgba(224, 49, 49, 0.1);
    border: 1px solid rgba(224, 49, 49, 0.3);
    border-radius: 4px;
  }

  .error-message {
    color: #e03131;
    font-size: var(--font-size-sm);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-2xl);
    text-align: center;
    color: var(--text-tertiary);
  }

  .implementation-with-add {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .add-btn-impl {
    padding: 2px 6px;
    background: transparent;
    border: none;
    border-radius: 3px;
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: 0.85rem;
    line-height: 1;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .add-btn-impl:hover {
    background: var(--accent);
    color: white;
  }
</style>
