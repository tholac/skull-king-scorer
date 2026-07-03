<script lang="ts">
  import ConnectionBadge from '$lib/components/shared/ConnectionBadge.svelte';
  import PeerPanel from '$lib/components/shared/PeerPanel.svelte';
  import { gameStore } from '$lib/store/gameStore';
  import * as m from '$lib/paraglide/messages.js';
  import { languageStore, setLanguage, pirateStore, togglePirate } from '$lib/store/languageStore.js';
</script>

{#key $languageStore}
<div class="h-screen flex flex-col overflow-hidden">
  <header class="navbar bg-base-200 border-b border-base-300 px-4 min-h-12 shrink-0 overflow-hidden">
    <div class="flex-1 min-w-0 overflow-hidden">
      <span class="font-bold text-lg tracking-tight truncate">☠️ Skore King</span>
    </div>
    <div class="flex-none flex flex-row gap-1 items-center">
      <ConnectionBadge />
      <div class="join">
        {#each (['en', 'fr'] as const) as lang}
          <button
            class="btn btn-xs join-item"
            class:btn-primary={$languageStore.startsWith(lang)}
            onclick={() => setLanguage(lang)}
          >{lang.toUpperCase()}</button>
        {/each}
      </div>
      <button
        class="btn btn-xs"
        class:btn-warning={$pirateStore}
        class:btn-ghost={!$pirateStore}
        onclick={togglePirate}
        title="Pirate mode"
      >☠️</button>
      {#if $gameStore.phase !== 'setup'}
        <PeerPanel />
        <button
          class="btn btn-ghost btn-xs hidden sm:inline-flex"
          onclick={() => {
            if (confirm(m.new_game_confirm())) {
              gameStore.newGame();
            }
          }}
        >
          {m.new_game()}
        </button>
        <button
          class="btn btn-ghost btn-xs sm:hidden"
          title={m.new_game()}
          onclick={() => {
            if (confirm(m.new_game_confirm())) {
              gameStore.newGame();
            }
          }}
        >
          🔄
        </button>
      {/if}
    </div>
  </header>

  <main class="flex-1 overflow-hidden">
    <slot />
  </main>
</div>
{/key}
