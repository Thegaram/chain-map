<script lang="ts">
  import { allTags } from '../lib/stores/inventory';
  import { filters } from '../lib/stores/filters';

  function toggleTag(tag: string) {
    filters.toggleTag(tag);
  }

  function isSelected(tag: string): boolean {
    return $filters.selectedTags.includes(tag);
  }

  function clearTags() {
    $filters.selectedTags.forEach(tag => filters.toggleTag(tag));
  }
</script>

{#if $allTags.length > 0}
  <div class="tag-filter">
    <div class="tag-filter-header">
      <span class="tag-filter-label">Tags:</span>
      {#if $filters.selectedTags.length > 0}
        <button class="clear-btn" on:click={clearTags}>
          Clear ({$filters.selectedTags.length})
        </button>
      {/if}
    </div>

    <div class="tag-chips">
      {#each $allTags as tag}
        <button
          class="tag-chip"
          class:selected={isSelected(tag)}
          on:click={() => toggleTag(tag)}
        >
          {tag}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .tag-filter {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .tag-filter-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .tag-filter-label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-secondary);
  }

  .clear-btn {
    font-size: var(--font-size-sm);
    color: var(--accent);
    padding: 2px var(--space-sm);
    border-radius: 3px;
    transition: background 0.15s ease;
  }

  .clear-btn:hover {
    background: var(--bg-tertiary);
  }

  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .tag-chip {
    display: inline-block;
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    transition: all 0.15s ease;
    cursor: pointer;
  }

  .tag-chip:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .tag-chip.selected {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
    font-weight: 500;
  }

  .tag-chip.selected:hover {
    background: var(--accent-hover);
    border-color: var(--accent-hover);
  }
</style>
