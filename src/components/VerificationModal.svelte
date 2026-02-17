<script lang="ts">
  import Modal from './Modal.svelte';
  import { toast } from '../lib/stores/ui';

  export let open: boolean;
  export let onClose: () => void;
  export let instructions: string;
  export let contractLabel: string;

  function copyToClipboard() {
    navigator.clipboard.writeText(instructions);
    toast.show('Verification instructions copied to clipboard');
  }
</script>

<Modal {open} {onClose} title="Verification: {contractLabel}" maxWidth="900px">
  <div class="verification-modal">
    <div class="modal-header-actions">
      <button class="copy-btn" on:click={copyToClipboard} title="Copy to clipboard">
        📋 Copy Instructions
      </button>
    </div>

    <div class="instructions-content">
      <pre><code>{instructions}</code></pre>
    </div>

    <div class="modal-footer">
      <p class="footer-note">
        <strong>Note:</strong> These instructions are a template. Adjust as needed for your specific deployment
        configuration.
      </p>
    </div>
  </div>
</Modal>

<style>
  .verification-modal {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .modal-header-actions {
    display: flex;
    justify-content: flex-end;
  }

  .copy-btn {
    padding: var(--space-xs) var(--space-md);
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .copy-btn:hover {
    background: var(--accent-hover);
  }

  .instructions-content {
    max-height: 600px;
    overflow-y: auto;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: var(--space-lg);
  }

  pre {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--text-primary);
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  code {
    font-family: inherit;
  }

  .modal-footer {
    padding-top: var(--space-sm);
    border-top: 1px solid var(--border-color);
  }

  .footer-note {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-style: italic;
  }

  .footer-note strong {
    color: var(--text-primary);
    font-style: normal;
  }
</style>
