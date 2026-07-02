<script lang="ts">
  import type { Player, Round } from '$lib/game/types';
  let { player, rank, rounds, onRemove }: {
    player: Player;
    rank: number;
    rounds: Round[];
    onRemove?: (id: string) => void;
  } = $props();

  const perRound = $derived(
    rounds.map((r) => r.scores.find((s) => s.playerId === player.id)?.roundScore ?? null),
  );
</script>

<tr class:opacity-40={!player.active}>
  <td class="text-xs font-mono w-6">{rank}</td>
  <td class="font-semibold">
    {player.name}
    {#if !player.active}<span class="badge badge-xs ml-1">out</span>{/if}
  </td>
  <td class="text-right font-bold tabular-nums">{player.totalScore}</td>
  <td class="text-xs text-base-content/50 tabular-nums">
    {#each perRound as score}
      <span class="mr-1">{score !== null ? (score >= 0 ? `+${score}` : score) : '—'}</span>
    {/each}
  </td>
  {#if onRemove && player.active}
    <td>
      <button
        class="btn btn-ghost btn-xs text-error"
        onclick={() => onRemove?.(player.id)}
        aria-label="Remove {player.name}"
      >✕</button>
    </td>
  {/if}
</tr>
