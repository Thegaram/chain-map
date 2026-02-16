<script lang="ts">
  import TopBar from './components/TopBar.svelte';
  import TagFilter from './components/TagFilter.svelte';
  import ContractTable from './components/ContractTable.svelte';
  import Drawer from './components/Drawer.svelte';
  import Toast from './components/Toast.svelte';
  import CommitHash from './components/CommitHash.svelte';
  import { isDirty, restoreLastFile } from './lib/stores/persistence';
  import { drawerOpen } from './lib/stores/ui';
  import { handleKeydown } from './lib/keyboardShortcuts';
  import { onMount } from 'svelte';

  // Warn before leaving with unsaved changes
  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if ($isDirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  // Restore last opened file on app startup
  onMount(async () => {
    await restoreLastFile();
  });
</script>

<svelte:window on:keydown={handleKeydown} on:beforeunload={handleBeforeUnload} />

<div class="app-container">
  <div class="top-section" class:dimmed={$drawerOpen}>
    <TopBar />
    <TagFilter />
  </div>

  <div class="main-content">
    <ContractTable />
    <Drawer />
  </div>
</div>

<Toast />
<CommitHash />

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .top-section {
    position: relative;
    transition: filter 0.2s ease;
  }

  .top-section.dimmed {
    filter: blur(2px);
    pointer-events: none;
  }

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }
</style>
