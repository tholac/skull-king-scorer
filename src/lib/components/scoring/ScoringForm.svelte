<script lang="ts">
  import { gameStore, activePlayers } from '$lib/store/gameStore';
  import BonusInput from './BonusInput.svelte';
  import TurnExtras from './TurnExtras.svelte';
  import { computeRoundScore } from '$lib/game/scoring';
  import type { TrickScore, TurnExtra } from '$lib/game/types';

  const cardsInPlay = $derived(
    $gameStore.meta.cardsPerRound[$gameStore.currentRound - 1] ?? 10,
  );

  let rows = $state<Record<string, { tricksWon: number; bidRespected: boolean; bonus: number }>>({});
  let turnExtras = $state<TurnExtra[]>([]);

  $effect(() => {
    for (const bid of $gameStore.currentBids) {
      if (!(bid.playerId in rows)) {
        rows[bid.playerId] = { tricksWon: bid.bid, bidRespected: true, bonus: 0 };
      }
    }
  });

  function getBid(playerId: string): number {
    return $gameStore.currentBids.find((b) => b.playerId === playerId)?.bid ?? 0;
  }

  function previewScore(playerId: string): number {
    const row = rows[playerId];
    if (!row) return 0;
    const bid = getBid(playerId);
    const tricks = row.bidRespected ? bid : row.tricksWon;
    return computeRoundScore(
      bid, tricks, row.bonus, cardsInPlay,
      $gameStore.currentRound, $gameStore.meta.scoringMethod,
    );
  }

  function save() {
    const scores: TrickScore[] = $activePlayers
      .filter((p) => $gameStore.currentBids.some((b) => b.playerId === p.id))
      .map((p) => {
        const row = rows[p.id] ?? { tricksWon: getBid(p.id), bidRespected: true, bonus: 0 };
        const bid = getBid(p.id);
        const tricks = row.bidRespected ? bid : row.tricksWon;
        return {
          playerId: p.id,
          bid,
          tricksWon: tricks,
          bidRespected: row.bidRespected,
          bonus: row.bonus,
          roundScore: previewScore(p.id),
        };
      });
    gameStore.saveRound(scores, turnExtras, cardsInPlay);
  }
</script>

<div class="max-w-lg mx-auto py-6 px-4">
  <h2 class="text-xl font-bold mb-4">Round {$gameStore.currentRound} — Scores</h2>

  <div class="space-y-3 mb-4">
    {#each $activePlayers as player (player.id)}
      {@const bid = getBid(player.id)}
      {@const row = rows[player.id] ?? { tricksWon: bid, bidRespected: true, bonus: 0 }}
      <div class="card bg-base-200 p-3">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="font-semibold flex-1 min-w-24">{player.name}</span>
          <span class="text-sm text-base-content/50">bid {bid}</span>

          <label class="flex items-center gap-1 text-sm cursor-pointer">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              bind:checked={rows[player.id].bidRespected}
            />
            Respected
          </label>

          {#if !row.bidRespected}
            <input
              type="number"
              class="input input-bordered input-sm w-16"
              min="0"
              bind:value={rows[player.id].tricksWon}
              placeholder="Won"
            />
          {/if}

          <BonusInput bind:value={rows[player.id].bonus} />

          <span class="font-bold tabular-nums ml-auto text-sm"
            class:text-success={previewScore(player.id) >= 0}
            class:text-error={previewScore(player.id) < 0}
          >
            {previewScore(player.id) >= 0 ? '+' : ''}{previewScore(player.id)}
          </span>
        </div>
      </div>
    {/each}
  </div>

  <TurnExtras bind:extras={turnExtras} />

  <button class="btn btn-primary w-full mt-2" onclick={save}>Save round ✓</button>
</div>
