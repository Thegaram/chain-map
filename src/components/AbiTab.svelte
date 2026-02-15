<script lang="ts">
  import {
    selectedContractId,
    toast,
    openDrawer,
    openContractForm,
    closeDrawer
  } from '../lib/stores/ui';
  import { inventory } from '../lib/stores/inventory';
  import { chains, chainMap } from '../lib/stores/chains';
  import { fetchAbiSmart } from '../lib/explorer';
  import {
    parseViewFunctions,
    callViewFunction,
    formatResult,
    formatFunctionSignature,
    getReturnType,
    extractAddresses,
    requiresInput,
    type AbiFunction
  } from '../lib/abi';
  import { createAddressLink } from '../lib/addressLink';
  import { saveIfDirty } from '../lib/stores/persistence';
  import type { Address } from 'viem';
  import Skeleton from './Skeleton.svelte';

  $: contract = $selectedContractId ? $inventory.find((c) => c.id === $selectedContractId) : null;
  $: chain = contract ? $chainMap.get(contract.chainId) : null;
  $: hasAbi = contract?.abi && contract.abi.length > 0;
  $: viewFunctions = hasAbi ? parseViewFunctions(contract!.abi!) : [];

  let loadingAbi = false;
  let callingFunction: { [key: string]: boolean } = {};
  let abiError: string | null = null;
  let showApiKeyInput = false;
  let apiKeyInput = '';

  // Auto-fetch ABIs and call parameter-free view functions on mount
  $: if (contract && !contract.abi && chain) {
    fetchAbi();
  }

  $: if (hasAbi && contract) {
    autoCallViewFunctions();
  }

  async function fetchAbi() {
    if (!contract || !chain || loadingAbi) return;

    loadingAbi = true;
    abiError = null;

    try {
      const result = await fetchAbiSmart(contract.address, chain, contract.implementation);

      if (result) {
        inventory.updateContract(contract.id, {
          abi: result.abi,
          abiSource: 'explorer',
          abiContractName: result.contractName
        });
        await saveIfDirty();
        toast.show(`Loaded ABI: ${result.contractName || 'Contract'}`);
      } else {
        abiError = 'Contract ABI not verified on explorer';
      }
    } catch (error: any) {
      console.error('Failed to fetch ABI:', error);
      abiError = error.message;

      // Check if it's an API key error
      if (error.message.includes('API key')) {
        showApiKeyInput = true;
      }
    } finally {
      loadingAbi = false;
    }
  }

  async function saveApiKey() {
    if (!chain || !apiKeyInput.trim()) return;

    // Update chain config with API key
    chains.updateChain(chain.chainId, {
      explorerApiKey: apiKeyInput.trim()
    });

    await saveIfDirty();
    showApiKeyInput = false;
    apiKeyInput = '';
    abiError = null;

    // Retry fetching ABI
    fetchAbi();
  }

  async function autoCallViewFunctions() {
    if (!contract || !hasAbi) return;

    // Call all view functions with no parameters
    const noParamFunctions = viewFunctions.filter((f) => !requiresInput(f));

    for (const func of noParamFunctions) {
      // Skip if we have a recent cached result (less than 5 minutes old)
      const cached = contract.viewFunctionCache?.[func.name];
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        continue;
      }

      // Call in background, don't await
      callFunction(func.name, []).catch(() => {
        // Silently fail auto-calls
      });
    }
  }

  async function callFunction(functionName: string, args: any[]) {
    if (!contract || !hasAbi || !chain) return;

    callingFunction[functionName] = true;

    try {
      const result = await callViewFunction(
        contract.address as Address,
        contract.chainId,
        contract.abi!,
        functionName,
        args
      );

      // Cache the result
      inventory.updateContract(contract.id, {
        viewFunctionCache: {
          ...contract.viewFunctionCache,
          [functionName]: {
            value: result,
            timestamp: Date.now()
          }
        }
      });
      await saveIfDirty();
    } catch (error: any) {
      toast.show(`${functionName}() failed: ${error.message}`, 'error');
    } finally {
      callingFunction[functionName] = false;
    }
  }

  function getCachedResult(functionName: string) {
    return contract?.viewFunctionCache?.[functionName]?.value;
  }

  function handleAddressClick(address: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const link = createAddressLink(address, $inventory, chain);

    if (link.type === 'inventory' && link.contractId) {
      openDrawer(link.contractId);
    } else if (link.type === 'explorer' && link.url) {
      window.open(link.url, '_blank');
    }
  }

  function renderValue(value: any, type: string) {
    const formatted = formatResult(value, type);
    const addresses = extractAddresses(value);

    if (addresses.length === 0) {
      return formatted;
    }

    // Simple case: single address
    if (addresses.length === 1 && formatted === addresses[0]) {
      return null; // Will render as link component
    }

    // Complex case: multiple addresses or address in struct
    return formatted;
  }

  function handleAddContract(address: string) {
    closeDrawer();
    setTimeout(() => {
      openContractForm(address);
    }, 100);
  }
</script>

<div class="abi-tab">
  {#if loadingAbi}
    <div class="section">
      <Skeleton width="100%" height="100px" />
    </div>
  {:else if hasAbi}
    <div class="section">
      <div class="section-header">
        <h3>
          {contract.abiContractName || 'Contract ABI'}
          <span class="function-count">({viewFunctions.length} view functions)</span>
        </h3>
        <button
          class="refresh-abi-btn"
          on:click={fetchAbi}
          disabled={loadingAbi}
          title="Refresh ABI from explorer"
        >
          ↻ Refresh ABI
        </button>
      </div>

      <div class="function-list">
        {#each viewFunctions as func (func.name)}
          {@const cached = getCachedResult(func.name)}
          {@const needsInput = requiresInput(func)}
          {@const isCalling = callingFunction[func.name]}

          {#if needsInput}
            <!-- Functions with arguments: show greyed out signature -->
            <div class="function-item disabled">
              <div class="function-signature-only">
                <code>{formatFunctionSignature(func)}</code>
              </div>
            </div>
          {:else}
            <!-- Functions without arguments: show results immediately -->
            <div class="function-item">
              <div class="function-header-inline">
                <div class="function-info">
                  <span class="function-name">{func.name}()</span>
                  <span class="function-return">→ {getReturnType(func)}</span>
                </div>
                <button
                  class="refresh-btn-inline"
                  on:click={() => callFunction(func.name, [])}
                  disabled={isCalling}
                  title="Refresh"
                >
                  ↻
                </button>
              </div>

              {#if isCalling}
                <div class="result-inline">
                  <Skeleton width="100%" height="24px" />
                </div>
              {:else if cached !== undefined}
                {@const outputType = func.outputs[0]?.type || 'unknown'}
                {@const isAddressType = outputType === 'address'}

                {#if isAddressType}
                  <!-- Single address return type -->
                  {@const addressValue = String(cached)}
                  {@const link = createAddressLink(addressValue, $inventory, chain)}
                  <div class="result-inline">
                    {#if link.type === 'inventory'}
                      <button
                        class="address-link inventory-link"
                        on:click={(e) => handleAddressClick(addressValue, e)}
                        title="Open {link.label}"
                      >
                        {addressValue} → {link.label}
                      </button>
                    {:else}
                      <div class="address-with-add">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener"
                          class="address-link explorer-link"
                        >
                          {addressValue} ↗
                        </a>
                        <button
                          class="add-btn"
                          on:click={() => handleAddContract(addressValue)}
                          title="Add to inventory"
                        >
                          +
                        </button>
                      </div>
                    {/if}
                  </div>
                {:else}
                  <!-- Other return types -->
                  {@const addresses = extractAddresses(cached)}
                  {@const formatted = renderValue(cached, outputType)}
                  <div class="result-inline">
                    <code class="result-value">{formatted}</code>
                    {#if addresses.length > 0}
                      <div class="addresses-found">
                        {#each addresses as address}
                          {@const link = createAddressLink(address, $inventory, chain)}
                          {#if link.type === 'inventory'}
                            <button
                              class="address-chip inventory-link"
                              on:click={(e) => handleAddressClick(address, e)}
                              title="Open {link.label}"
                            >
                              {address} → {link.label}
                            </button>
                          {:else}
                            <div class="chip-with-add">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener"
                                class="address-chip explorer-link"
                              >
                                {address} ↗
                              </a>
                              <button
                                class="add-btn-chip"
                                on:click={() => handleAddContract(address)}
                                title="Add to inventory"
                              >
                                +
                              </button>
                            </div>
                          {/if}
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/if}
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {:else if abiError}
    <div class="empty-state">
      <p class="empty-title">Failed to load ABI</p>
      <p class="empty-text error-text">{abiError}</p>

      {#if showApiKeyInput}
        <div class="api-key-input">
          <p class="info-text">
            Get a free API key from
            <a href="https://etherscan.io/myapikey" target="_blank" rel="noopener">Etherscan</a>
          </p>
          <input
            type="text"
            bind:value={apiKeyInput}
            placeholder="Enter Etherscan API key"
            class="api-key-field"
          />
          <div class="button-group">
            <button class="btn btn-primary" on:click={saveApiKey} disabled={!apiKeyInput.trim()}>
              Save API Key
            </button>
            <button class="btn btn-secondary" on:click={() => (showApiKeyInput = false)}>
              Cancel
            </button>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="empty-state">
      <p class="empty-title">No ABI loaded</p>
      <p class="empty-text">
        {#if chain?.explorerApiUrl}
          Fetching ABI from {chain.shortName} explorer...
        {:else}
          No explorer API configured for this chain
        {/if}
      </p>
    </div>
  {/if}
</div>

<style>
  .abi-tab {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .refresh-abi-btn {
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .refresh-abi-btn:hover:not(:disabled) {
    border-color: var(--border-hover);
    background: var(--bg-tertiary);
    color: var(--accent);
  }

  .refresh-abi-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  h3 {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-primary);
  }

  .function-count {
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: var(--text-tertiary);
  }

  .function-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .function-item {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: var(--space-sm) var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .function-item.disabled {
    opacity: 0.5;
  }

  .function-signature-only {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
  }

  .function-header-inline {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .function-info {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .function-name {
    font-family: var(--font-mono);
    font-weight: 500;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
  }

  .function-return {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
  }

  .refresh-btn-inline {
    padding: 2px 6px;
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    transition: color 0.15s ease;
  }

  .refresh-btn-inline:hover:not(:disabled) {
    color: var(--accent);
  }

  .refresh-btn-inline:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .result-inline {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .result-value {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    word-break: break-all;
  }

  .addresses-found {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    margin-top: var(--space-xs);
  }

  .address-with-add {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .chip-with-add {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 3px;
  }

  .chip-with-add:hover {
    border-color: var(--border-hover);
    background: var(--bg-secondary);
  }

  .add-btn,
  .add-btn-chip {
    background: none;
    border: none;
    padding: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    transition: color 0.15s ease;
  }

  .add-btn:hover,
  .add-btn-chip:hover {
    color: var(--accent);
  }

  .address-link,
  .address-chip {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .address-link {
    display: inline-block;
    color: var(--accent);
  }

  .address-chip {
    color: var(--text-secondary);
  }

  .address-chip.inventory-link {
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 3px;
  }

  .address-chip.inventory-link:hover {
    border-color: var(--border-hover);
    background: var(--bg-secondary);
  }

  .inventory-link {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--accent);
    text-align: left;
  }

  .inventory-link:hover {
    text-decoration: underline;
  }

  .explorer-link {
    color: var(--text-secondary);
  }

  .explorer-link:hover {
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
    gap: var(--space-sm);
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

  .empty-text.error-text {
    color: #e03131;
  }

  .api-key-input {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    margin-top: var(--space-md);
    width: 100%;
    max-width: 400px;
  }

  .api-key-field {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-sm);
    font-family: var(--font-mono);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .api-key-field:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .button-group {
    display: flex;
    gap: var(--space-sm);
  }

  .btn {
    padding: var(--space-sm) var(--space-lg);
    border-radius: 4px;
    font-weight: 500;
    font-size: var(--font-size-sm);
    transition: all 0.15s ease;
    cursor: pointer;
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

  .btn-secondary:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-hover);
  }

  a {
    color: var(--accent);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
</style>
