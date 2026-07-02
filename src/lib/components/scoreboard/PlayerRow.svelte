<script lang="ts">
  import type { Player, Round } from '$lib/game/types';
  import * as m from '$lib/paraglide/messages.js';
  import { languageStore } from '$lib/store/languageStore.js';
  let { player, rank, rounds, onRemove }: {
    player: Player;
    rank: number;
    rounds: Round[];
    onRemove?: (id: string) => void;
  } = $props();

  function formatScore(score: number | null): string {
    if (score === null) return '—';
    return score >= 0 ? `+${score}` : String(score);
  }

  function scoreClass(score: number | null): string {
    if (score === null) return 'text-base-content/40';
    return score >= 0 ? 'text-success' : 'text-error';
  }
</script>

{#key $languageStore}
<tr class:opacity-40={!player.active}>
  <td class="text-xs font-mono w-6">{rank}</td>
  <td class="font-semibold">
    {player.name}
    {#if !player.active}<span class="badge badge-xs ml-1">{m.scoreboard_out()}</span>{/if}
  </td>
  <td class="text-right font-bold tabular-nums">{player.totalScore}</td>
  {#each rounds as round (round.number)}
    {@const score = round.scores.find((s) => s.playerId === player.id)?.roundScore ?? null}
    <td
      class={`text-right text-xs tabular-nums ${scoreClass(score)}`}
    >
      {formatScore(score)}
    </td>
  {/each}
  <td>
    {#if onRemove && player.active}
      <button
        class="btn btn-ghost btn-xs text-error"
        onclick={() => onRemove?.(player.id)}
        aria-label={m.scoreboard_remove_player({ name: player.name })}
        >🗑️</button
      >
    {/if}
  </td>
</tr>
{/key}
