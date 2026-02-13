<script lang="ts">
  import { selectedContractId } from '../lib/stores/selectedContract';
  import { inventory } from '../lib/stores/inventory';
  import { chainMap } from '../lib/stores/chains';
  import { getBytecodeInfo, formatBytecodeSize } from '../lib/chain/bytecode';
  import { detectProxy, formatProxyType } from '../lib/chain/proxy';
  import { getExplorerAddressUrl } from '../lib/links';
  import type { Address } from 'viem';

  // Make contract reactive to inventory changes
  $: contract = $selectedContractId ? $inventory.find(c => c.id === $selectedContractId) || null : null;
  $: chain = contract ? $chainMap.get(contract.chainId) : null;

  let loadingBytecode = false;
  let loadingProxy = false;
  let error: string | null = null;

  async function fetchBytecode() {
    if (!contract) return;

    loadingBytecode = true;
    error = null;

    try {
      const bytecodeInfo = await getBytecodeInfo(
        contract.address as Address,
        contract.chainId
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
      const proxyInfo = await detectProxy(
        contract.address as Address,
        contract.chainId
      );

      // Save to contract record
      inventory.updateContract(contract.id, {
        proxyType: proxyInfo.type,
        implementation: proxyInfo.implementation || undefined
      });
    } catch (err: any) {
      console.error('Failed to fetch proxy info:', err);
    } finally {
      loadingProxy = false;
    }
  }

</script>

{#if contract}
  <div class="onchain-tab">
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
              {#if loadingBytecode}
                <span class="spinner-small"></span>
              {:else}
                ↻
              {/if}
            </button>
          </div>
          {#if contract.codehash}
            <code class="info-value">{contract.codehash}</code>
          {:else}
            <span class="info-value empty">—</span>
          {/if}
        </div>
        <div class="info-item">
          <div class="info-header">
            <span class="info-label">Size</span>
          </div>
          {#if contract.bytecodeSize !== undefined}
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
              {#if loadingProxy}
                <span class="spinner-small"></span>
              {:else}
                ↻
              {/if}
            </button>
          </div>
          {#if contract.proxyType}
            <span class="info-value">{formatProxyType(contract.proxyType)}</span>
          {:else}
            <span class="info-value empty">—</span>
          {/if}
        </div>
        {#if contract.implementation}
          <div class="info-item">
            <div class="info-header">
              <span class="info-label">Implementation</span>
            </div>
            <code class="info-value">{contract.implementation}</code>
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
  .onchain-tab {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  h3 {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-secondary);
  }

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .info-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .info-label {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
  }

  .info-value {
    font-size: var(--font-size-base);
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

  .spinner-small {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid var(--border-color);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
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

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-2xl);
    text-align: center;
    color: var(--text-tertiary);
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
</style>
