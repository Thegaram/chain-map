<script lang="ts">
  import { toast, toastList } from '../lib/stores/ui';

  function getIcon(type?: string) {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
        return 'ℹ';
      default:
        return '✓';
    }
  }
</script>

<div class="toast-container">
  {#each $toastList as item (item.id)}
    <div class="toast toast-{item.type || 'success'}" on:click={() => toast.dismiss(item.id)}>
      <span class="toast-icon">{getIcon(item.type)}</span>
      <span class="toast-message">{item.message}</span>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: var(--space-lg);
    right: var(--space-lg);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    box-shadow: var(--shadow-md);
    font-size: var(--font-size-sm);
    min-width: 200px;
    animation: slideIn 0.2s ease;
    pointer-events: auto;
    cursor: pointer;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .toast-success {
    border-left: 3px solid #2f9e44;
  }

  .toast-error {
    border-left: 3px solid #e03131;
  }

  .toast-info {
    border-left: 3px solid var(--accent);
  }

  .toast-icon {
    font-weight: bold;
    font-size: 1rem;
  }

  .toast-success .toast-icon {
    color: #2f9e44;
  }

  .toast-error .toast-icon {
    color: #e03131;
  }

  .toast-info .toast-icon {
    color: var(--accent);
  }

  .toast-message {
    color: var(--text-primary);
  }

  .toast:hover {
    background: var(--bg-secondary);
  }
</style>
