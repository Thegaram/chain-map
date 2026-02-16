<script lang="ts">
  import Modal from './Modal.svelte';
  import { loadInventoryFromUrl } from '../lib/stores/persistence';
  import { INVENTORY_EXAMPLES, type InventoryExample } from '../lib/constants';

  export let open: boolean;
  export let onClose: () => void;

  let activeTab: 'url' | 'examples' = 'url';
  let url = '';
  let loading = false;
  let error = '';

  function resetForm() {
    url = '';
    loading = false;
    error = '';
    activeTab = 'url';
  }

  function validateUrl(urlString: string): boolean {
    try {
      const parsedUrl = new URL(urlString);
      const isLocalhost = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
      // Allow HTTP for localhost, require HTTPS for remote URLs
      return parsedUrl.protocol === 'https:' || (parsedUrl.protocol === 'http:' && isLocalhost);
    } catch {
      return false;
    }
  }

  async function handleLoadFromUrl() {
    error = '';

    if (!url.trim()) {
      error = 'Please enter a URL';
      return;
    }

    if (!validateUrl(url.trim())) {
      error = 'Invalid URL. Remote URLs must use HTTPS (HTTP allowed for localhost).';
      return;
    }

    loading = true;

    try {
      await loadInventoryFromUrl(url.trim());
      resetForm();
      onClose();
    } catch (err: any) {
      error = err.message || 'Failed to load inventory from URL';
    } finally {
      loading = false;
    }
  }

  async function handleLoadExample(example: InventoryExample) {
    error = '';
    loading = true;

    try {
      // Resolve relative to current URL, ensuring trailing slash for proper resolution
      const base = window.location.href.endsWith('/')
        ? window.location.href
        : window.location.href + '/';
      const url = new URL(example.url, base).href;
      await loadInventoryFromUrl(url);
      resetForm();
      onClose();
    } catch (err: any) {
      error = `Failed to load example: ${err.message}`;
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    if (!loading) {
      resetForm();
      onClose();
    }
  }

  function formatLastUpdated(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Compare dates (ignore time)
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Updated today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Updated yesterday';
    } else {
      // Format as "Updated Feb 16, 2026"
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      };
      return `Updated ${date.toLocaleDateString('en-US', options)}`;
    }
  }
</script>

<Modal {open} onClose={handleClose} title="Open from URL" maxWidth="700px">
  <div class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'url'}
      on:click={() => (activeTab = 'url')}
      disabled={loading}
    >
      URL
    </button>
    <button
      class="tab"
      class:active={activeTab === 'examples'}
      on:click={() => (activeTab = 'examples')}
      disabled={loading}
    >
      Examples
    </button>
  </div>

  {#if activeTab === 'url'}
    <div class="tab-content">
      <div class="info-box">
        <p>
          Load an inventory from a public HTTPS URL. The inventory will be opened in read-only mode.
          You can browse and inspect contracts, but changes won't be saved to the URL.
        </p>
        <p class="tip">💡 Use "Save As" to create a local editable copy.</p>
      </div>

      <div class="field-group">
        <label for="url-input">
          HTTPS URL <span class="required">*</span>
        </label>
        <input
          id="url-input"
          type="text"
          bind:value={url}
          placeholder="https://example.com/inventory.json"
          disabled={loading}
          class:error={error && !loading}
          on:keydown={(e) => e.key === 'Enter' && handleLoadFromUrl()}
        />
        {#if error && !loading}
          <span class="error-text">{error}</span>
        {/if}
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" on:click={handleClose} disabled={loading}>
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          on:click={handleLoadFromUrl}
          disabled={loading || !url.trim()}
        >
          {loading ? 'Loading...' : 'Load Inventory'}
        </button>
      </div>
    </div>
  {:else}
    <div class="tab-content">
      <div class="info-box">
        <p>
          Choose from curated 3rd-party inventory examples. These are community-contributed contract
          collections you can explore.
        </p>
      </div>

      {#if error}
        <div class="error-banner">
          {error}
        </div>
      {/if}

      <div class="examples-grid">
        {#each INVENTORY_EXAMPLES as example (example.name)}
          <button
            class="example-card"
            on:click={() => handleLoadExample(example)}
            disabled={loading}
          >
            <div class="example-header">
              <h3>{example.name}</h3>
              <div class="example-tags">
                {#each example.tags as tag (tag)}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            </div>
            <p class="example-description">{example.description}</p>
            <p class="example-updated">{formatLastUpdated(example.lastUpdated)}</p>
          </button>
        {/each}
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" on:click={handleClose} disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  {/if}
</Modal>

<style>
  .tabs {
    display: flex;
    gap: var(--space-sm);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: var(--space-lg);
  }

  .tab {
    padding: var(--space-sm) var(--space-lg);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-secondary);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tab:hover:not(:disabled) {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }

  .tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  .tab:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tab-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }

  .info-box {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: var(--space-md);
  }

  .info-box p {
    margin: 0 0 var(--space-sm) 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .info-box p:last-child {
    margin-bottom: 0;
  }

  .info-box .tip {
    color: var(--text-tertiary);
    font-style: italic;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  label {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-secondary);
  }

  .required {
    color: #e03131;
  }

  input {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
  }

  input.error {
    border-color: #e03131;
  }

  .error-text {
    font-size: var(--font-size-sm);
    color: #e03131;
  }

  .error-banner {
    background: #ffe0e0;
    border: 1px solid #e03131;
    color: #c92a2a;
    padding: var(--space-md);
    border-radius: 4px;
    font-size: var(--font-size-sm);
  }

  .examples-grid {
    display: grid;
    gap: var(--space-md);
    max-height: 400px;
    overflow-y: auto;
  }

  .example-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-secondary);
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .example-card:hover:not(:disabled) {
    border-color: var(--accent);
    background: var(--bg-tertiary);
  }

  .example-card:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .example-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-md);
  }

  .example-header h3 {
    margin: 0;
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--text-primary);
  }

  .example-tags {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .tag {
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11px;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
  }

  .example-description {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .example-updated {
    margin: 0;
    font-size: 11px;
    color: var(--text-tertiary);
    font-style: italic;
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

  .btn-primary:hover:not(:disabled) {
    background: var(--accent-hover);
    border-color: var(--accent-hover);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--bg-tertiary);
    border-color: var(--border-hover);
  }

  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
