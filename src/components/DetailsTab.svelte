<script lang="ts">
  import { inventory } from '../lib/stores/inventory';
  import { selectedContractId, closeDrawer } from '../lib/stores/selectedContract';
  import { chains } from '../lib/stores/chains';
  import { parseTags } from '../lib/validation';
  import { UI_MESSAGES } from '../lib/constants';
  import type { ContractType } from '../lib/types';

  $: contract = $selectedContractId ? inventory.getContract($selectedContractId) : null;

  let editedLabel = '';
  let editedChainId = 1;
  let editedType: ContractType = 'implementation';
  let editedTags = '';
  let editedSource = '';
  let editedNotes = '';

  $: if (contract) {
    editedLabel = contract.label;
    editedChainId = contract.chainId;
    editedType = contract.type;
    editedTags = contract.tags.join(', ');
    editedSource = contract.source || '';
    editedNotes = contract.notes || '';
  }

  function handleSave() {
    if (!contract) return;

    inventory.updateContract(contract.id, {
      label: editedLabel,
      chainId: editedChainId,
      type: editedType,
      tags: parseTags(editedTags),
      source: editedSource.trim() || undefined,
      notes: editedNotes || undefined,
    });

    alert(UI_MESSAGES.SAVE_SUCCESS);
  }

  function handleDelete() {
    if (!contract) return;

    if (confirm(UI_MESSAGES.DELETE_CONFIRM(contract.label))) {
      inventory.deleteContract(contract.id);
      closeDrawer();
    }
  }
</script>

{#if contract}
  <div class="details-tab">
    <div class="field-group">
      <label for="label">Label</label>
      <input id="label" type="text" bind:value={editedLabel} />
    </div>

    <div class="field-group">
      <label for="address">Address</label>
      <input id="address" type="text" value={contract.address} readonly />
    </div>

    <div class="field-row">
      <div class="field-group">
        <label for="chain">Chain</label>
        <select id="chain" bind:value={editedChainId}>
          {#each $chains as chain}
            <option value={chain.chainId}>{chain.name}</option>
          {/each}
        </select>
      </div>

      <div class="field-group">
        <label for="type">Type</label>
        <select id="type" bind:value={editedType}>
          <option value="implementation">Implementation</option>
          <option value="proxy">Proxy</option>
        </select>
      </div>
    </div>

    <div class="field-group">
      <label for="tags">Tags (comma separated)</label>
      <input id="tags" type="text" bind:value={editedTags} />
    </div>

    <div class="field-group">
      <label for="source">Source Repository (paste GitHub URL or use owner/repo@ref)</label>
      <input id="source" type="text" bind:value={editedSource} placeholder="e.g., scroll-tech/scroll-contracts@v4.0.0 or full GitHub URL" />
    </div>

    <div class="field-group">
      <label for="notes">Notes</label>
      <textarea id="notes" rows="6" bind:value={editedNotes}></textarea>
    </div>

    <div class="actions">
      <button class="btn btn-primary" on:click={handleSave}>Save Changes</button>
      <button class="btn btn-secondary" on:click={handleDelete}>Delete Contract</button>
    </div>
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
    gap: var(--space-lg);
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
  }

  label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-secondary);
  }

  input[readonly] {
    opacity: 0.6;
    cursor: default;
  }

  textarea {
    resize: vertical;
    font-family: var(--font-mono);
    line-height: 1.5;
  }

  .actions {
    display: flex;
    gap: var(--space-sm);
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
