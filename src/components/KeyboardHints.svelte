<script lang="ts">
  import { getShortcuts, formatShortcut } from '../lib/keyboardShortcuts';

  export let open = false;

  let showHints = false;

  // Sync with external open prop
  $: showHints = open;

  function toggleHints() {
    showHints = !showHints;
    open = showHints;
  }

  function handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' ||
                     target.tagName === 'TEXTAREA' ||
                     target.isContentEditable;

    // Toggle with ?
    if (event.key === '?' && !event.metaKey && !event.ctrlKey && !isTyping) {
      event.preventDefault();
      toggleHints();
    }

    // Close with ESC
    if (event.key === 'Escape' && showHints) {
      event.preventDefault();
      showHints = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if showHints}
  <div class="hints-overlay" on:click={toggleHints} role="button" tabindex="-1">
    <div class="hints-panel" on:click|stopPropagation>
      <div class="hints-header">
        <h3>Keyboard Shortcuts</h3>
        <button class="close-btn" on:click={toggleHints}>✕</button>
      </div>

      <div class="hints-list">
        {#each getShortcuts() as shortcut}
          <div class="hint-item">
            <kbd>{formatShortcut(shortcut)}</kbd>
            <span>{shortcut.description}</span>
          </div>
        {/each}

        <div class="hint-item">
          <kbd>ESC</kbd>
          <span>Close drawer/modal</span>
        </div>

        <div class="hint-item">
          <kbd>?</kbd>
          <span>Show keyboard shortcuts</span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .hints-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
  }

  .hints-panel {
    background: var(--bg-primary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 500px;
    animation: slideUp 0.2s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .hints-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--border-color);
  }

  h3 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  .close-btn {
    padding: var(--space-sm);
    border-radius: 4px;
    color: var(--text-secondary);
    font-size: 1.5rem;
    line-height: 1;
  }

  .close-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .hints-list {
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .hint-item {
    display: flex;
    align-items: center;
    gap: var(--space-lg);
  }

  kbd {
    display: inline-block;
    min-width: 80px;
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    text-align: center;
    color: var(--text-primary);
  }

  .hint-item span {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
</style>
