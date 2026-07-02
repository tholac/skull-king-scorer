<script lang="ts">
  import { gameStore, canGoBack } from '$lib/store/gameStore';
  import Scoreboard from '$lib/components/scoreboard/Scoreboard.svelte';
  import * as m from '$lib/paraglide/messages.js';
  import { languageStore } from '$lib/store/languageStore.js';

  const winner = $derived(
    [...$gameStore.players]
      .filter((p) => p.active)
      .sort((a, b) => b.totalScore - a.totalScore)[0],
  );
</script>

{#key $languageStore}
<div class="py-12 px-4 text-center">
  <div class="text-6xl mb-4">☠️</div>
  <h1 class="text-3xl font-bold mb-2">{m.gameover_title()}</h1>
  {#if winner}
    <p class="text-xl mb-6">
      {m.gameover_winner({ name: winner.name, score: winner.totalScore })}
    </p>
  {/if}

  <div class="mb-8">
    <Scoreboard />
  </div>

  <div class="flex gap-3 justify-center">
    {#if $canGoBack}
      <button class="btn btn-ghost" onclick={() => gameStore.goBack()}>{m.gameover_edit_last_round()}</button>
    {/if}
    <button
      class="btn btn-primary"
      onclick={() => {
        if (confirm(m.gameover_new_game_confirm())) gameStore.newGame();
      }}
    >{m.new_game()}</button>
  </div>
</div>
{/key}
