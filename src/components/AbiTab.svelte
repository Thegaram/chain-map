<script lang="ts">
  import { selectedContractId } from '../lib/stores/selectedContract';
  import { inventory } from '../lib/stores/inventory';

  $: contract = $selectedContractId ? inventory.getContract($selectedContractId) : null;

  // Placeholder - ABI management will be implemented in Phase 5
  const hasAbi = false;
  const abiMethods = [
    { name: 'totalSupply', type: 'view', returns: 'uint256' },
    { name: 'balanceOf', type: 'view', returns: 'uint256' },
    { name: 'transfer', type: 'write', returns: 'bool' }
  ];
</script>

<div class="abi-tab">
  {#if hasAbi}
    <div class="section">
      <div class="section-header">
        <h3>ABI Methods</h3>
        <button class="btn-link">Export ABI</button>
      </div>

      <div class="method-list">
        {#each abiMethods as method}
          <div class="method-item">
            <div class="method-header">
              <span class="method-name">{method.name}()</span>
              <span class="method-type">{method.type}</span>
            </div>
            <div class="method-returns">
              Returns: <code>{method.returns}</code>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="section">
      <h3>Interact (Read-only)</h3>
      <p class="info-text">Select a method above to call it</p>
    </div>
  {:else}
    <div class="empty-state">
      <p class="empty-title">No ABI loaded</p>
      <p class="empty-text">Upload or paste an ABI to enable contract interaction</p>
      <div class="empty-actions">
        <button class="btn btn-primary">Upload ABI</button>
        <button class="btn btn-secondary">Paste ABI JSON</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .abi-tab {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h3 {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-secondary);
  }

  .btn-link {
    color: var(--accent);
    font-size: var(--font-size-sm);
    text-decoration: none;
  }

  .btn-link:hover {
    text-decoration: underline;
  }

  .method-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .method-item {
    padding: var(--space-md);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .method-item:hover {
    border-color: var(--border-hover);
    background: var(--bg-tertiary);
  }

  .method-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-xs);
  }

  .method-name {
    font-family: var(--font-mono);
    font-weight: 500;
    color: var(--text-primary);
  }

  .method-type {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    text-transform: uppercase;
  }

  .method-returns {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .method-returns code {
    font-family: var(--font-mono);
    color: var(--accent);
  }

  .info-text {
    color: var(--text-tertiary);
    font-size: var(--font-size-sm);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-xl) 0;
    gap: var(--space-md);
  }

  .empty-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  .empty-text {
    color: var(--text-tertiary);
    font-size: var(--font-size-sm);
  }

  .empty-actions {
    display: flex;
    gap: var(--space-sm);
    margin-top: var(--space-md);
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

  .btn-secondary {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-hover);
  }
</style>
