<script lang="ts">
  import {
    gameStore,
    activePlayers,
    canGoBack,
    canGoForward,
  } from '$lib/store/gameStore';
  import AddPlayerModal from '$lib/components/setup/AddPlayerModal.svelte';
  import type { Bid } from '$lib/game/types';
  import type { ScorePreset } from '$lib/game/playerUtils';
  import NumberInput from '../shared/NumberInput.svelte';
  import * as m from '$lib/paraglide/messages.js';
  import { languageStore } from '$lib/store/languageStore.js';

  const cardsInPlay = $derived(
    $gameStore.meta.cardsPerRound[$gameStore.currentRound - 1] ?? 10,
  );

  let cardsOverride = $state<number | null>(null);
  const effectiveCards = $derived(cardsOverride ?? cardsInPlay);

  let bids = $state<Record<string, number>>({});
  let modalOpen = $state(false);
  let loadedBidKey = $state('');

  const savedRound = $derived(
    $gameStore.rounds.find((r) => r.number === $gameStore.currentRound),
  );
  const sourceBids = $derived(
    $gameStore.currentBids.length
      ? $gameStore.currentBids
      : (savedRound?.bids ?? []),
  );
  const bidPlayers = $derived(
    sourceBids.length
      ? sourceBids
          .map((bid) => $gameStore.players.find((p) => p.id === bid.playerId))
          .filter((player) => player !== undefined)
      : $activePlayers,
  );

  $effect(() => {
    const nextKey = `${$gameStore.currentRound}|${sourceBids
      .map((bid) => `${bid.playerId}:${bid.bid}`)
      .join(',')}`;

    if (nextKey === loadedBidKey) return;

    const nextBids: Record<string, number> = {};
    for (const player of bidPlayers) {
      nextBids[player.id] =
        sourceBids.find((bid) => bid.playerId === player.id)?.bid ?? 0;
    }
    bids = nextBids;
    loadedBidKey = nextKey;
  });

  $effect(() => {
    const bidPlayerIds = new Set(bidPlayers.map((p) => p.id));

    for (const id of Object.keys(bids)) {
      if (!bidPlayerIds.has(id)) delete bids[id];
    }

    for (const p of bidPlayers) {
      if (!(p.id in bids)) bids[p.id] = 0;
    }
  });

  const bidSum = $derived(
    bidPlayers.reduce((sum, p) => sum + (bids[p.id] ?? 0), 0),
  );

  const sumEmoji = $derived(
    bidSum === effectiveCards ? '✅' : bidSum > effectiveCards ? '☠️' : '🦈',
  );

  function adjustBid(playerId: string, delta: number) {
    const current = bids[playerId] ?? 0;
    bids[playerId] = Math.max(0, current + delta);
  }

  function proceed() {
    const bidList: Bid[] = bidPlayers.map((p) => ({
      playerId: p.id,
      bid: bids[p.id] ?? 0,
    }));
    gameStore.submitBids(bidList);
  }

  function handleAddPlayer(name: string, score: ScorePreset | number) {
    gameStore.addPlayer(name, score);
  }

  function handleRemovePlayer(playerId: string, playerName: string) {
    if ($activePlayers.length <= 2) {
      alert(m.bidding_min_players());
      return;
    }
    if (confirm(m.bidding_remove_player_confirm({ name: playerName }))) {
      gameStore.removePlayer(playerId);
    }
  }
</script>

{#key $languageStore}
<div class="max-w-lg mx-auto py-6 px-4">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-bold">{m.bidding_title({ round: $gameStore.currentRound })}</h2>
    <div class="flex items-center gap-2">
      <label for="cards-in-play" class="text-sm text-base-content/60">{m.bidding_cards_label()}</label>
      <input
        id="cards-in-play"
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

  <div class="mb-6 rounded-lg overflow-hidden border border-base-300">
    {#each bidPlayers as player, i (player.id)}
      <div class="flex items-center gap-3 px-3 py-2" class:bg-gray-800={i % 2 === 0} class:bg-gray-500={i % 2 !== 0}>
        <span class="flex-1 font-medium">{player.name}</span>
        <NumberInput
          bind:value={bids[player.id]}
          min={0}
          valueName={`${player.name} bid`}
        />
        <button
          type="button"
          class="btn btn-sm btn-ghost text-error"
          aria-label={m.scoreboard_remove_player({ name: player.name })}
          onclick={() => handleRemovePlayer(player.id, player.name)}
        >
          🗑️
        </button>
      </div>
    {/each}
  </div>

  <div class="flex gap-2 justify-between">
    <div class="flex gap-2">
      {#if $canGoBack}
        <button class="btn btn-ghost btn-sm" onclick={() => gameStore.goBack()}>{m.nav_back()}</button>
      {/if}
      {#if $canGoForward}
        <button class="btn btn-ghost btn-sm" onclick={() => gameStore.goForward()}>{m.nav_forward()}</button>
      {/if}
      <button class="btn btn-ghost btn-sm" onclick={() => (modalOpen = true)}>{m.bidding_add_player()}</button>
    </div>
    <button class="btn btn-primary" onclick={proceed}>{m.bidding_lock()}</button>
  </div>
</div>

<AddPlayerModal
  bind:open={modalOpen}
  activePlayers={$activePlayers}
  midGame={true}
  onAdd={handleAddPlayer}
/>
{/key}
