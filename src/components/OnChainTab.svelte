<script lang="ts">
  import { selectedContractId } from '../lib/stores/selectedContract';
  import { inventory } from '../lib/stores/inventory';

  $: contract = $selectedContractId ? inventory.getContract($selectedContractId) : null;

  // Placeholder data - RPC calls will be implemented in Phase 4
  const onchainData = {
    codehash: '0xabc123def456789...',
    bytecodeSize: '12,345 bytes',
    isProxy: false,
    implementation: null,
    verified: false
  };
</script>

<div class="onchain-tab">
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
    </div>
  </div>

  <div class="section">
    <h3>Proxy Detection</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Is Proxy</span>
        <span class="info-value">{onchainData.isProxy ? 'Yes' : 'No'}</span>
      </div>
      {#if onchainData.implementation}
        <div class="info-item">
          <span class="info-label">Implementation</span>
          <code class="info-value">{onchainData.implementation}</code>
        </div>
      {/if}
    </div>
  </div>

  <div class="section">
    <h3>Verification Status</h3>
    <div class="verification-status">
      {#if onchainData.verified}
        <span class="status-badge verified">✓ Verified</span>
      {:else}
        <span class="status-badge unverified">? Unverified</span>
      {/if}
    </div>
  </div>

  <div class="section">
    <h3>Explorer Links</h3>
    <div class="link-list">
      <a href="#" class="explorer-link">View on Etherscan →</a>
      <a href="#" class="explorer-link">View Bytecode →</a>
    </div>
  </div>

  <div class="actions">
    <button class="btn btn-primary">Refresh RPC Data</button>
  </div>
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

  .verification-status {
    display: flex;
    gap: var(--space-sm);
  }

  .status-badge {
    padding: var(--space-xs) var(--space-md);
    border-radius: 4px;
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  .status-badge.verified {
    background: rgba(34, 139, 230, 0.1);
    color: var(--accent);
    border: 1px solid rgba(34, 139, 230, 0.3);
  }

  .status-badge.unverified {
    background: var(--bg-tertiary);
    color: var(--text-tertiary);
    border: 1px solid var(--border-color);
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
</style>
