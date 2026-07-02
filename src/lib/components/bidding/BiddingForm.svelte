<script lang="ts">
  import { gameStore, activePlayers } from '$lib/store/gameStore';
  import AddPlayerModal from '$lib/components/setup/AddPlayerModal.svelte';
  import type { Bid } from '$lib/game/types';
  import type { ScorePreset } from '$lib/game/playerUtils';

  const cardsInPlay = $derived(
    $gameStore.meta.cardsPerRound[$gameStore.currentRound - 1] ?? 10,
  );

  let cardsOverride = $state<number | null>(null);
  const effectiveCards = $derived(cardsOverride ?? cardsInPlay);

  let bids = $state<Record<string, number>>({});
  let modalOpen = $state(false);

  $effect(() => {
    for (const p of $activePlayers) {
      if (!(p.id in bids)) bids[p.id] = 0;
    }
  });

  const bidSum = $derived(Object.values(bids).reduce((s, v) => s + v, 0));

  const sumEmoji = $derived(
    bidSum === effectiveCards ? '✅' : bidSum > effectiveCards ? '☠️' : '🦈',
  );

  function proceed() {
    const bidList: Bid[] = $activePlayers.map((p) => ({
      playerId: p.id,
      bid: bids[p.id] ?? 0,
    }));
    gameStore.submitBids(bidList);
  }

  function handleAddPlayer(name: string, score: ScorePreset | number) {
    gameStore.addPlayer(name, score);
  }
</script>

<div class="max-w-lg mx-auto py-6 px-4">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-bold">Round {$gameStore.currentRound} — Bids</h2>
    <div class="flex items-center gap-2">
      <label class="text-sm text-base-content/60">Cards:</label>
      <input
        type="number"
        class="input input-bordered input-sm w-16"
        min="1"
        value={effectiveCards}
        oninput={(e) => {
          const v = parseInt((e.target as HTMLInputElement).value);
          cardsOverride = isNaN(v) ? null : v;
        }}
      />
    </div>
  </div>

  <div class="text-lg font-mono mb-4 text-center">
    {sumEmoji} Σ {bidSum} / {effectiveCards}
  </div>

  <div class="space-y-3 mb-6">
    {#each $activePlayers as player (player.id)}
      <div class="flex items-center gap-3">
        <span class="flex-1 font-medium">{player.name}</span>
        <input
          type="number"
          class="input input-bordered w-20 text-center"
          min="0"
          bind:value={bids[player.id]}
        />
      </div>
    {/each}
  </div>

  <div class="flex gap-2 justify-between">
    <button class="btn btn-ghost btn-sm" onclick={() => (modalOpen = true)}>+ Add player</button>
    <button class="btn btn-primary" onclick={proceed}>Lock bids →</button>
  </div>
</div>

<AddPlayerModal
  bind:open={modalOpen}
  activePlayers={$activePlayers}
  midGame={true}
  onAdd={handleAddPlayer}
/>
