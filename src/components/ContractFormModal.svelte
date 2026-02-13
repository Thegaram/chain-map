<script lang="ts">
  import Modal from './Modal.svelte';
  import { inventory } from '../lib/stores/inventory';
  import { chains } from '../lib/stores/chains';
  import { validateContractForm, parseTags } from '../lib/validation';
  import type { ContractRecord, ContractType } from '../lib/types';

  export let open: boolean;
  export let onClose: () => void;
  export let contract: ContractRecord | null = null;

  let label = '';
  let address = '';
  let chainId = 1;
  let tags = '';
  let source = '';
  let errors: Record<string, string> = {};

  // Initialize form when contract changes
  $: if (contract) {
    label = contract.label;
    address = contract.address;
    chainId = contract.chainId;
    tags = contract.tags.join(', ');
    source = contract.source || '';
  } else if (open) {
    // Reset form for new contract
    label = '';
    address = '';
    chainId = 1;
    tags = '';
    source = '';
  }

  function handleSubmit() {
    // Validate form
    const validation = validateContractForm({
      label,
      address
    });

    if (!validation.valid) {
      errors = validation.errors;
      return;
    }

    errors = {};
    const tagArray = parseTags(tags);

    if (contract) {
      // Update existing contract
      inventory.updateContract(contract.id, {
        label: label.trim(),
        chainId,
        tags: tagArray,
        source: source.trim() || undefined,
      });
    } else {
      // Add new contract (type will be auto-detected from proxy detection)
      inventory.addContract({
        label: label.trim(),
        address: address.trim(),
        chainId,
        type: 'implementation', // Default, will be updated by proxy detection
        tags: tagArray,
        source: source.trim() || undefined,
      });
    }

    handleClose();
  }

  function handleClose() {
    errors = {};
    onClose();
  }
</script>

<Modal
  {open}
  onClose={handleClose}
  title={contract ? 'Edit Contract' : 'Add New Contract'}
  maxWidth="700px"
>
  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-grid">
      <div class="field-group span-2">
        <label for="label">
          Label <span class="required">*</span>
        </label>
        <input
          id="label"
          type="text"
          bind:value={label}
          placeholder="e.g., USDC Token"
          class:error={errors.label}
        />
        {#if errors.label}
          <span class="error-text">{errors.label}</span>
        {/if}
      </div>

      <div class="field-group span-2">
        <label for="address">
          Address <span class="required">*</span>
        </label>
        <input
          id="address"
          type="text"
          bind:value={address}
          placeholder="0x..."
          disabled={!!contract}
          class:error={errors.address}
        />
        {#if errors.address}
          <span class="error-text">{errors.address}</span>
        {:else if contract}
          <span class="help-text">Address cannot be changed</span>
        {/if}
      </div>

      <div class="field-group">
        <label for="chain">
          Chain <span class="required">*</span>
        </label>
        <select id="chain" bind:value={chainId}>
          {#each $chains as chain}
            <option value={chain.chainId}>{chain.name}</option>
          {/each}
        </select>
      </div>

      <div class="field-group span-2">
        <label for="tags">
          Tags
          <span class="help-text-inline">(comma separated)</span>
        </label>
        <input
          id="tags"
          type="text"
          bind:value={tags}
          placeholder="e.g., token, production, v1.0"
        />
      </div>

      <div class="field-group span-2">
        <label for="source">
          Source Repository
          <span class="help-text-inline">(paste GitHub URL or use owner/repo@ref)</span>
        </label>
        <input
          id="source"
          type="text"
          bind:value={source}
          placeholder="e.g., scroll-tech/scroll-contracts@v4.0.0 or full GitHub URL"
        />
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" on:click={handleClose}>
        Cancel
      </button>
      <button type="submit" class="btn btn-primary">
        {contract ? 'Save Changes' : 'Add Contract'}
      </button>
    </div>
  </form>
</Modal>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-lg);
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .field-group.span-2 {
    grid-column: span 2;
  }

  label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-secondary);
  }

  .required {
    color: #e03131;
  }

  .help-text-inline {
    color: var(--text-tertiary);
    font-weight: 400;
  }

  input,
  select,
  textarea {
    font-family: var(--font-mono);
  }

  input.error,
  textarea.error {
    border-color: #e03131;
  }

  input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-text {
    font-size: var(--font-size-sm);
    color: #e03131;
  }

  .help-text {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
  }

  textarea {
    resize: vertical;
    font-family: var(--font-mono);
    line-height: 1.5;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    padding-top: var(--space-md);
    border-top: 1px solid var(--border-color);
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
