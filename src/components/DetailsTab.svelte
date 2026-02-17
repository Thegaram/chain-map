<script lang="ts">
  import { inventory } from '../lib/stores/inventory';
  import { selectedContractId, closeDrawer, openDrawer, openContractForm } from '../lib/stores/ui';
  import { chains, chainMap } from '../lib/stores/chains';
  import { parseTags } from '../lib/validation';
  import { getBytecodeInfo, formatBytecodeSize } from '../lib/onchain';
  import { detectProxy, formatProxyType } from '../lib/onchain';
  import { getExplorerAddressUrl, getGitHubUrl } from '../lib/links';
  import type { ContractType, ContractRecord } from '../lib/types';
  import type { Address } from 'viem';
  import { toast } from '../lib/stores/ui';
  import Skeleton from './Skeleton.svelte';
  import { saveIfDirty } from '../lib/stores/persistence';
  import { createAddressLink } from '../lib/addressLink';
  import { getProxiesForImplementation, getImplementationForProxy } from '../lib/proxyGraph';
  import VerificationModal from './VerificationModal.svelte';
  import { generateVerificationInstructions } from '../lib/verification';

  // Make contract reactive to inventory changes
  let contract: ContractRecord | null = null;
  $: if ($selectedContractId) {
    contract = $inventory.find((c) => c.id === $selectedContractId) || null;
  } else {
    contract = null;
  }
  $: chain = contract ? $chainMap.get(contract.chainId) : undefined;

  // Compute proxy-implementation relationships
  $: proxiesUsingThisImpl = contract ? getProxiesForImplementation(contract.id, $inventory) : [];
  $: implementationContract = contract ? getImplementationForProxy(contract.id, $inventory) : null;

  let editedLabel = '';
  let editedChainId = 1;
  let editedTags = '';
  let editedSource = '';

  let loadingBytecode = false;
  let loadingProxy = false;
  let error: string | null = null;
  let savedField: string | null = null;
  let detailsContainer: HTMLDivElement;
  let verificationModalOpen = false;
  let verificationInstructions = '';

  // Check if verification template is available
  $: hasVerificationTemplate =
    contract && chain ? generateVerificationInstructions(contract, chain) !== null : false;

  $: if (contract && detailsContainer) {
    editedLabel = contract.label;
    editedChainId = contract.chainId;
    editedTags = contract.tags.join(', ');
    editedSource = contract.source || '';

    // Focus container so Tab goes to first input
    detailsContainer.focus();
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
    if (!contract || !chain) return;

    loadingBytecode = true;
    error = null;

    try {
      const bytecodeInfo = await getBytecodeInfo(
        contract.address as Address,
        contract.chainId,
        chain
      );

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
    if (!contract || !chain) return;

    loadingProxy = true;

    try {
      const proxyInfo = await detectProxy(contract.address as Address, contract.chainId, chain);

      // Auto-detect type based on proxy detection
      const detectedType: ContractType = proxyInfo.isProxy ? 'proxy' : 'implementation';

      // Save to contract record
      inventory.updateContract(contract.id, {
        type: detectedType,
        proxyType: proxyInfo.type || undefined,
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

  function showVerificationInstructions() {
    if (!contract || !chain) return;

    const instructions = generateVerificationInstructions(contract, chain);
    if (instructions) {
      verificationInstructions = instructions;
      verificationModalOpen = true;
    } else {
      toast.show('No verification template available for this repository', 'info');
    }
  }

  function closeVerificationModal() {
    verificationModalOpen = false;
  }

  async function toggleVerified() {
    if (!contract) return;
    inventory.updateContract(contract.id, { verified: !contract.verified });
    await saveIfDirty();
    showSavedIndicator('verified');
  }
</script>

{#if contract}
  <div class="details-tab" tabindex="-1" bind:this={detailsContainer}>
    <div class="field-group">
      <div class="label-with-indicator">
        <label for="label">Label</label>
        {#if savedField === 'label'}
          <span class="saved-indicator">✓</span>
        {/if}
      </div>
      <input id="label" type="text" bind:value={editedLabel} on:blur={handleLabelBlur} />
    </div>

    <div class="field-group">
      <label for="address">Address</label>
      <input
        id="address"
        type="text"
        value={contract.address}
        readonly
        class="clickable-copy"
        on:click={() => copyToClipboard(contract!.address, 'Address')}
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
        {#each $chains as chain (chain.chainId)}
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
        {#if savedField === 'source' || savedField === 'verified'}
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
      {#if contract.type === 'proxy'}
        <p class="help-text">
          Source links to proxy contract code (e.g., TransparentUpgradableProxy)
        </p>
      {:else if contract.type === 'implementation'}
        <p class="help-text">Source links to implementation logic source code</p>
      {/if}
      {#if contract.type === 'proxy' && implementationContract?.source}
        {@const implGitHubUrl = getGitHubUrl(implementationContract.source)}
        {#if implGitHubUrl}
          <a href={implGitHubUrl} target="_blank" rel="noopener" class="impl-source-link">
            View implementation source →
          </a>
        {/if}
      {/if}
      {#if contract.source}
        <div class="source-actions">
          <label class="verified-toggle">
            <input
              type="checkbox"
              checked={contract.verified || false}
              on:change={toggleVerified}
            />
            <span>Verified</span>
          </label>
          {#if hasVerificationTemplate}
            <button class="verification-btn" on:click={showVerificationInstructions}>
              📋 View Verification Instructions
            </button>
          {/if}
        </div>
      {/if}
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
            <button
              class="code-button"
              on:click={() => copyToClipboard(contract!.codehash!, 'Codehash')}
              title="Click to copy"
            >
              <code class="info-value">
                {contract.codehash}
              </code>
            </button>
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
            <span class="info-value">{formatProxyType(contract.proxyType as any)}</span>
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
                    setTimeout(
                      () => openContractForm(contract!.implementation, contract!.chainId),
                      100
                    );
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

    <!-- Used by Proxies section (for implementations) -->
    {#if contract.type === 'implementation'}
      <div class="section">
        <h3>
          Used by Proxies {#if proxiesUsingThisImpl.length > 0}({proxiesUsingThisImpl.length}){/if}
        </h3>
        {#if proxiesUsingThisImpl.length > 0}
          <div class="proxy-list">
            {#each proxiesUsingThisImpl as proxy (proxy.id)}
              <button
                class="proxy-item"
                on:click={() => openDrawer(proxy.id)}
                title="Open {proxy.label}"
              >
                <span class="proxy-label">{proxy.label}</span>
                <span class="proxy-address"
                  >{proxy.address.slice(0, 10)}...{proxy.address.slice(-8)}</span
                >
              </button>
            {/each}
          </div>
        {:else}
          <p class="empty-text">Not used by any proxies in inventory</p>
        {/if}
      </div>
    {/if}

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

<VerificationModal
  open={verificationModalOpen}
  onClose={closeVerificationModal}
  instructions={verificationInstructions}
  contractLabel={contract?.label || ''}
/>

<style>
  .details-tab {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    outline: none; /* Hide focus outline when programmatically focused */
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

  .clickable-copy {
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .clickable-copy:hover {
    color: var(--accent);
  }

  .code-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: opacity 0.15s ease;
  }

  .code-button:hover {
    opacity: 0.8;
  }

  .code-button:hover code {
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

  .help-text {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    margin: 0;
    font-style: italic;
  }

  .impl-source-link {
    font-size: var(--font-size-xs);
    color: var(--accent);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .impl-source-link:hover {
    color: var(--accent-hover);
    text-decoration: underline;
  }

  .proxy-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .proxy-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .proxy-item:hover {
    background: var(--bg-tertiary);
    border-color: var(--accent);
  }

  .proxy-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-primary);
  }

  .proxy-address {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }

  .empty-text {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    font-style: italic;
    margin: 0;
  }

  .source-actions {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    margin-top: var(--space-xs);
  }

  .verified-toggle {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    cursor: pointer;
  }

  .verified-toggle input[type='checkbox'] {
    cursor: pointer;
  }

  .verification-btn {
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    width: fit-content;
  }

  .verification-btn:hover {
    background: var(--bg-tertiary);
    border-color: var(--accent);
    color: var(--text-primary);
  }
</style>
