<script lang="ts">
  import { get } from 'svelte/store';
  import { gameStore, activePlayers } from '$lib/store/gameStore';
  import AddPlayerModal from '$lib/components/setup/AddPlayerModal.svelte';
  import * as m from '$lib/paraglide/messages.js';
  import { languageStore } from '$lib/store/languageStore.js';
  import type { Round, TimelineEvent } from '$lib/game/types';
  let { event }: { event: TimelineEvent } = $props();
  let expanded = $state(false);
  let editModalOpen = $state(false);

  const playerJoinedPayload = $derived(
    event.type === 'player_joined'
      ? (event.payload as { playerId?: string; name: string; initialScore: number })
      : null,
  );

  // playerId may be absent in events saved before the field was added; fall back to name+round lookup
  function resolvePlayerId(): string | null {
    if (!playerJoinedPayload) return null;
    if (playerJoinedPayload.playerId) return playerJoinedPayload.playerId;
    return get(gameStore).players.find(
      (p) => p.name === playerJoinedPayload.name && p.joinedAtRound === event.round,
    )?.id ?? null;
  }

  const editPlayerData = $derived(
    playerJoinedPayload
      ? { name: playerJoinedPayload.name, scoreOffset: playerJoinedPayload.initialScore }
      : null,
  );

  const icons: Record<string, string> = {
    game_start: '🏴‍☠️',
    round_start: '⚓',
    round_end: '☠️',
    round_updated: '✏️',
    game_ended_early: '🏁',
    player_joined: '🌊',
    player_removed: '🌊',
    turn_extra: '⛈️',
  };

  const icon = $derived(icons[event.type] ?? '📌');

  function computeLabel(_lang: string): string {
    switch (event.type) {
      case 'game_start': return m.timeline_game_started();
      case 'round_start': return m.timeline_round_start({ round: event.round ?? 0, cards: (event.payload as { cards: number }).cards });
      case 'round_end': return m.timeline_round_complete({ round: event.round ?? 0 });
      case 'round_updated': return m.timeline_round_updated({ round: event.round ?? 0 });
      case 'game_ended_early': return m.timeline_game_ended_early({ round: (event.payload as { finalRound: number }).finalRound });
      case 'player_joined': return m.timeline_player_joined({ name: (event.payload as { name: string }).name });
      case 'player_removed': return m.timeline_player_left({ name: (event.payload as { name: string }).name });
      case 'turn_extra': return String(event.payload.type ?? 'Event');
      default: return event.type;
    }
  }
  const label = $derived(computeLabel($languageStore));

  function getPlayerName(playerId: string): string {
    return $gameStore.players.find((p) => p.id === playerId)?.name ?? `Unknown (${playerId.slice(0, 8)})`;
  }

  function formatScore(score: number): string {
    return score >= 0 ? `+${score}` : String(score);
  }

  function getUpdatedRounds(): { before: Round | null; after: Round | null } {
    const payload = event.payload as { before?: Round; after?: Round };
    return {
      before: payload.before ?? null,
      after: payload.after ?? null,
    };
  }

  function getChangedPlayerIds(before: Round | null, after: Round | null): string[] {
    const ids = new Set<string>();
    for (const bid of before?.bids ?? []) ids.add(bid.playerId);
    for (const bid of after?.bids ?? []) ids.add(bid.playerId);
    for (const score of before?.scores ?? []) ids.add(score.playerId);
    for (const score of after?.scores ?? []) ids.add(score.playerId);
    return [...ids];
  }

  function getBid(round: Round | null, playerId: string): number | null {
    return round?.bids.find((bid) => bid.playerId === playerId)?.bid ?? null;
  }

  function getRoundScore(round: Round | null, playerId: string): number | null {
    return round?.scores.find((score) => score.playerId === playerId)?.roundScore ?? null;
  }

  function getTricksWon(round: Round | null, playerId: string): number | null {
    return round?.scores.find((score) => score.playerId === playerId)?.tricksWon ?? null;
  }

  function getBonus(round: Round | null, playerId: string): number | null {
    return round?.scores.find((score) => score.playerId === playerId)?.bonus ?? null;
  }

  function formatExtras(round: Round | null): string {
    if (!round || round.turnExtras.length === 0) return '—';
    return round.turnExtras
      .map((extra) => `${extra.type}${extra.count ? ` x${extra.count}` : ''}`)
      .join(', ');
  }

  function canEditRound(round: number): boolean {
    return round >= 1 && round <= $gameStore.meta.totalRounds;
  }
</script>

{#key $languageStore}
<li class="flex gap-2 text-xs py-1">
  <span class="shrink-0 w-5 text-center">{icon}</span>
  <div class="min-w-0 flex-1">
    <div class="flex items-start gap-1">
      <button
        class="min-w-0 flex-1 text-left text-base-content/80 hover:text-base-content transition-colors"
        onclick={() => (expanded = !expanded)}
      >
        {label}
      </button>
      {#if event.type === 'player_joined'}
        <button
          class="btn btn-ghost btn-xs min-h-5 h-5 px-1"
          aria-label={m.timeline_edit_player()}
          title={m.timeline_edit_player()}
          onclick={() => (editModalOpen = true)}
        >✏️</button>
      {:else if event.round !== null && canEditRound(event.round)}
        <button
          class="btn btn-ghost btn-xs min-h-5 h-5 px-1"
          aria-label={m.timeline_edit_round({ round: event.round })}
          title={m.timeline_edit_round({ round: event.round })}
          onclick={() => {
            if (event.round !== null) gameStore.goToRound(event.round);
          }}
        >✏️</button>
      {/if}
    </div>

    {#if event.type === 'player_joined' && expanded && playerJoinedPayload}
      <div class="mt-1 text-base-content/50">
        {m.timeline_starting_score({ score: playerJoinedPayload.initialScore })}
      </div>
    {/if}

    {#if event.type === 'round_end' && expanded}
      <div class="mt-1 text-base-content/50">
        {#each (event.payload.scores as Array<{ playerId: string; roundScore: number }>) as s}
          <div>{getPlayerName(s.playerId)}: {formatScore(s.roundScore)}</div>
        {/each}
      </div>
    {/if}

    {#if event.type === 'round_updated' && expanded}
      {@const updated = getUpdatedRounds()}
      {@const changedPlayerIds = getChangedPlayerIds(updated.before, updated.after)}
      <div class="mt-1 space-y-1 text-base-content/60">
        {#if updated.before?.cardsInPlay !== updated.after?.cardsInPlay}
          <div>
            {m.timeline_cards_changed({ before: updated.before?.cardsInPlay ?? '—', after: updated.after?.cardsInPlay ?? '—' })}
          </div>
        {/if}

        <div class="overflow-x-auto">
          <table class="table table-xs w-full">
            <thead>
              <tr>
                <th>{m.timeline_col_player()}</th>
                <th class="text-right">{m.timeline_col_bid()}</th>
                <th class="text-right">{m.timeline_col_tricks()}</th>
                <th class="text-right">{m.timeline_col_bonus()}</th>
                <th class="text-right">{m.timeline_col_score()}</th>
              </tr>
            </thead>
            <tbody>
              {#each changedPlayerIds as playerId}
                {@const beforeBid = getBid(updated.before, playerId)}
                {@const afterBid = getBid(updated.after, playerId)}
                {@const beforeScore = getRoundScore(updated.before, playerId)}
                {@const afterScore = getRoundScore(updated.after, playerId)}
                {@const beforeTricks = getTricksWon(updated.before, playerId)}
                {@const afterTricks = getTricksWon(updated.after, playerId)}
                {@const beforeBonus = getBonus(updated.before, playerId)}
                {@const afterBonus = getBonus(updated.after, playerId)}
                {#if beforeBid !== afterBid || beforeTricks !== afterTricks || beforeBonus !== afterBonus || beforeScore !== afterScore}
                  <tr>
                    <td>{getPlayerName(playerId)}</td>
                    <td class="text-right tabular-nums">
                      {beforeBid ?? '—'} → {afterBid ?? '—'}
                    </td>
                    <td class="text-right tabular-nums">
                      {beforeTricks ?? '—'} → {afterTricks ?? '—'}
                    </td>
                    <td class="text-right tabular-nums">
                      {beforeBonus ?? '—'} → {afterBonus ?? '—'}
                    </td>
                    <td class="text-right tabular-nums">
                      {beforeScore !== null ? formatScore(beforeScore) : '—'} → {afterScore !== null ? formatScore(afterScore) : '—'}
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>

        {#if JSON.stringify(updated.before?.turnExtras ?? []) !== JSON.stringify(updated.after?.turnExtras ?? [])}
          <div>
            {m.timeline_extras_changed({ before: formatExtras(updated.before), after: formatExtras(updated.after) })}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if event.type === 'player_joined' && playerJoinedPayload}
    <AddPlayerModal
      bind:open={editModalOpen}
      activePlayers={$activePlayers}
      midGame={true}
      editPlayer={editPlayerData}
      onEdit={(name, scoreOffset) => {
        const id = resolvePlayerId();
        if (id) gameStore.updatePlayer(id, name, scoreOffset);
      }}
    />
  {/if}
</li>
{/key}
