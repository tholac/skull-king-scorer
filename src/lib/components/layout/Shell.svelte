<script lang="ts">
  import ConnectionBadge from '$lib/components/shared/ConnectionBadge.svelte';
  import PeerPanel from '$lib/components/shared/PeerPanel.svelte';
  import { gameStore } from '$lib/store/gameStore';
</script>

<div class="h-screen flex flex-col overflow-hidden">
  <header class="navbar bg-base-200 border-b border-base-300 px-4 min-h-12 shrink-0">
    <div class="flex-1">
      <span class="font-bold text-lg tracking-tight">☠️ Skore King</span>
    </div>
    <div class="flex-none gap-2 items-center">
      <ConnectionBadge />
      {#if $gameStore.phase !== 'setup'}
        <PeerPanel />
        <button
          class="btn btn-ghost btn-xs"
          onclick={() => {
            if (confirm('Start a new game? Current game will be lost.')) {
              gameStore.newGame();
            }
          }}
        >
          New game
        </button>
      {/if}
    </div>
  </header>

  <main class="flex-1 overflow-hidden">
    <slot />
  </main>
</div>
