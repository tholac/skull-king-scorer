<script lang="ts">
  import { gameStore } from '$lib/store/gameStore';
  import PlayerRow from './PlayerRow.svelte';
  import * as m from '$lib/paraglide/messages.js';
  import { languageStore } from '$lib/store/languageStore.js';

  const sorted = $derived(
    [...$gameStore.players].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return b.totalScore - a.totalScore;
    }),
  );

  const ranked = $derived.by(() => {
    const entries: Array<{ player: (typeof sorted)[number]; rank: number }> = [];
    let lastScore: number | null = null;
    let lastRank = 1;

    for (const [i, player] of sorted.entries()) {
      if (i === 0) {
        lastRank = 1;
      } else if (player.totalScore !== lastScore) {
        lastRank = i + 1;
      }

      entries.push({ player, rank: lastRank });
      lastScore = player.totalScore;
    }

    return entries;
  });

  const scoreRounds = $derived(
    [...$gameStore.rounds]
      .filter((round) => round.number <= $gameStore.meta.totalRounds)
      .sort((a, b) => a.number - b.number),
  );
</script>

{#key $languageStore}
<div class="p-3">
  <h2 class="font-bold text-sm uppercase tracking-wider text-base-content/60 mb-2">{m.scoreboard_title()}</h2>
  <div class="overflow-x-auto">
    <table class="table table-xs w-full">
      <thead>
        <tr>
          <th>{m.scoreboard_col_rank()}</th>
          <th>{m.scoreboard_col_player()}</th>
          <th class="text-right">{m.scoreboard_col_total()}</th>
          {#each scoreRounds as round (round.number)}
            <th class="text-right">{m.scoreboard_col_round({ n: round.number })}</th>
          {/each}
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each ranked as entry}
          <PlayerRow
            player={entry.player}
            rank={entry.rank}
            rounds={scoreRounds}
            onRemove={$gameStore.phase === 'bidding' ? gameStore.removePlayer : undefined}
          />
        {/each}
      </tbody>
    </table>
  </div>
</div>
{/key}
