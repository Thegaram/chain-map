<script lang="ts">
  // @ts-ignore - This is injected by Vite at build time
  const commitHash = __COMMIT_HASH__ || 'dev';
</script>

<div class="commit-hash" title="Git commit hash">
  {commitHash}
</div>

<style>
  .commit-hash {
    position: fixed;
    bottom: var(--space-sm);
    right: var(--space-sm);
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-tertiary);
    opacity: 0.4;
    padding: 2px 6px;
    background: var(--bg-secondary);
    border-radius: 3px;
    border: 1px solid var(--border-color);
    pointer-events: none;
    user-select: none;
    z-index: 999;
  }

  .commit-hash:hover {
    opacity: 0.8;
  }
</style>
