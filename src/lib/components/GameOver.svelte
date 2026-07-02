<script lang="ts">
  import { gameStore } from '$lib/store/gameStore';
  import Scoreboard from '$lib/components/scoreboard/Scoreboard.svelte';

  const winner = $derived(
    [...$gameStore.players]
      .filter((p) => p.active)
      .sort((a, b) => b.totalScore - a.totalScore)[0],
  );
</script>

<div class="max-w-lg mx-auto py-12 px-4 text-center">
  <div class="text-6xl mb-4">☠️</div>
  <h1 class="text-3xl font-bold mb-2">Game over!</h1>
  {#if winner}
    <p class="text-xl mb-6">
      🏆 <span class="font-bold">{winner.name}</span> wins with {winner.totalScore} pts!
    </p>
  {/if}

  <div class="mb-8">
    <Scoreboard />
  </div>

  <button
    class="btn btn-primary"
    onclick={() => {
      if (confirm('Start a new game?')) gameStore.newGame();
    }}
  >New game</button>
</div>
