<script lang="ts">
  import { selectedContractId } from '../lib/stores/selectedContract';
  import { inventory } from '../lib/stores/inventory';
  import { chainMap } from '../lib/stores/chains';
  import { getBytecodeInfo, compareCodehash, formatBytecodeSize } from '../lib/chain/bytecode';
  import { detectProxy, formatProxyType } from '../lib/chain/proxy';
  import type { Address } from 'viem';

  $: contract = $selectedContractId ? inventory.getContract($selectedContractId) : null;
  $: chain = contract ? $chainMap.get(contract.chainId) : null;

  let loading = false;
  let error: string | null = null;
  let onchainData: {
    codehash: string;
    bytecodeSize: string;
    isProxy: boolean;
    proxyType: string;
    implementation: string | null;
    codehashMatch: boolean;
    codehashReason?: string;
  } | null = null;

  async function fetchOnChainData() {
    if (!contract || !chain) return;

    loading = true;
    error = null;

    try {
      // Fetch bytecode info
      const bytecodeInfo = await getBytecodeInfo(
        contract.address as Address,
        contract.chainId
      );

      if (bytecodeInfo.isEmpty) {
        error = 'No bytecode found at this address';
        onchainData = null;
        return;
      }

      // Detect proxy
      const proxyInfo = await detectProxy(
        contract.address as Address,
        contract.chainId
      );

      // Compare codehash
      const comparison = compareCodehash(bytecodeInfo.codehash, contract.expectedCodehash);

      onchainData = {
        codehash: bytecodeInfo.codehash,
        bytecodeSize: formatBytecodeSize(bytecodeInfo.size),
        isProxy: proxyInfo.isProxy,
        proxyType: formatProxyType(proxyInfo.type),
        implementation: proxyInfo.implementation || null,
        codehashMatch: comparison.matches,
        codehashReason: comparison.reason
      };
    } catch (err: any) {
      error = err.message || 'Failed to fetch on-chain data';
      onchainData = null;
    } finally {
      loading = false;
    }
  }

  // Auto-fetch when contract changes
  $: if (contract) {
    fetchOnChainData();
  }

  function getExplorerUrl(type: 'address' | 'bytecode'): string | null {
    if (!contract || !chain?.explorerUrl) return null;

    if (type === 'address') {
      return `${chain.explorerUrl}/address/${contract.address}`;
    } else {
      return `${chain.explorerUrl}/address/${contract.address}#code`;
    }
  }

  function saveAsExpected() {
    if (!contract || !onchainData) return;

    inventory.updateContract(contract.id, {
      expectedCodehash: onchainData.codehash
    });
  }
</script>

<div class="onchain-tab">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Fetching on-chain data...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <p class="error-message">⚠ {error}</p>
      <button class="btn btn-primary" on:click={fetchOnChainData}>
        Retry
      </button>
    </div>
  {:else if onchainData}
    <div class="section">
      <h3>Runtime Bytecode</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Codehash</span>
          <code class="info-value">{onchainData.codehash}</code>
        </div>
        <div class="info-item">
          <span class="info-label">Size</span>
          <span class="info-value">{onchainData.bytecodeSize}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Verification</span>
          {#if contract?.expectedCodehash}
            <span class="info-value" class:match={onchainData.codehashMatch} class:mismatch={!onchainData.codehashMatch}>
              {onchainData.codehashMatch ? '✓ Matches expected' : '✗ Does not match expected'}
            </span>
          {:else}
            <button class="btn-inline" on:click={saveAsExpected}>
              Save as Expected
            </button>
          {/if}
        </div>
      </div>
    </div>

    <div class="section">
      <h3>Proxy Detection</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Type</span>
          <span class="info-value">{onchainData.proxyType}</span>
        </div>
        {#if onchainData.implementation}
          <div class="info-item">
            <span class="info-label">Implementation</span>
            <code class="info-value">{onchainData.implementation}</code>
          </div>
        {/if}
      </div>
    </div>

    {#if chain?.explorerUrl}
      <div class="section">
        <h3>Explorer Links</h3>
        <div class="link-list">
          <a href={getExplorerUrl('address')} target="_blank" rel="noopener" class="explorer-link">
            View on {chain.shortName} Explorer →
          </a>
          <a href={getExplorerUrl('bytecode')} target="_blank" rel="noopener" class="explorer-link">
            View Bytecode →
          </a>
        </div>
      </div>
    {/if}

    <div class="actions">
      <button class="btn btn-primary" on:click={fetchOnChainData}>
        Refresh RPC Data
      </button>
    </div>
  {:else}
    <div class="empty-state">
      <p>Click "Refresh RPC Data" to fetch on-chain information</p>
    </div>
  {/if}
</div>

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

  .info-label {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
  }

  .info-value {
    font-size: var(--font-size-base);
    color: var(--text-primary);
  }

  code {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--text-secondary);
    word-break: break-all;
  }

  .link-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
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

  .actions {
    padding-top: var(--space-md);
  }

  .btn {
    padding: var(--space-sm) var(--space-lg);
    border-radius: 4px;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
    border: 1px solid var(--accent);
  }

  .btn-primary:hover {
    background: var(--accent-hover);
    border-color: var(--accent-hover);
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-2xl);
    gap: var(--space-lg);
    text-align: center;
    color: var(--text-secondary);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-color);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-message {
    color: #e03131;
  }

  .match {
    color: #2f9e44;
  }

  .mismatch {
    color: #e03131;
  }

  .btn-inline {
    padding: var(--space-xs) var(--space-md);
    border-radius: 4px;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--accent);
    background: transparent;
    border: 1px solid var(--accent);
    transition: all 0.15s ease;
    cursor: pointer;
  }

  .btn-inline:hover {
    background: rgba(34, 139, 230, 0.1);
  }
</style>
