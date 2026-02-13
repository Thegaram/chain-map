<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let x = 0;
  export let y = 0;
  export let visible = false;

  const dispatch = createEventDispatcher();

  export interface MenuItem {
    label: string;
    icon?: string;
    shortcut?: string;
    action: string;
    divider?: boolean;
    danger?: boolean;
  }

  export let items: MenuItem[] = [];

  function handleClick(action: string) {
    dispatch('select', action);
    visible = false;
  }

  function handleClickOutside(event: MouseEvent) {
    if (visible) {
      visible = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

{#if visible}
  <div class="context-menu" style="left: {x}px; top: {y}px;">
    {#each items as item}
      {#if item.divider}
        <div class="divider"></div>
      {:else}
        <button
          class="menu-item"
          class:danger={item.danger}
          on:click|stopPropagation={() => handleClick(item.action)}
        >
          <span class="menu-label">
            {#if item.icon}
              <span class="menu-icon">{item.icon}</span>
            {/if}
            {item.label}
          </span>
          {#if item.shortcut}
            <span class="menu-shortcut">{item.shortcut}</span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .context-menu {
    position: fixed;
    z-index: 1000;
    background: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    box-shadow: var(--shadow-lg);
    padding: var(--space-xs);
    min-width: 200px;
    animation: fadeIn 0.1s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
    border-radius: 4px;
    text-align: left;
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    transition: background 0.1s ease;
  }

  .menu-item:hover {
    background: var(--bg-secondary);
  }

  .menu-item.danger {
    color: #e03131;
  }

  .menu-item.danger:hover {
    background: rgba(224, 49, 49, 0.1);
  }

  .menu-label {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .menu-icon {
    font-size: 1rem;
  }

  .menu-shortcut {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    margin-left: var(--space-md);
  }

  .divider {
    height: 1px;
    background: var(--border-color);
    margin: var(--space-xs) 0;
  }
</style>
