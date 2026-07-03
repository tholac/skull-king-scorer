<script lang="ts">
  import {
    gameStore,
    canGoBack,
    canGoForward,
  } from "$lib/store/gameStore";
  import TurnExtras from "./TurnExtras.svelte";
  import { computeRoundScore } from "$lib/game/scoring";
  import type { TrickScore, TurnExtra } from "$lib/game/types";
  import NumberInput from "../shared/NumberInput.svelte";
  import * as m from "$lib/paraglide/messages.js";
  import { languageStore } from "$lib/store/languageStore.js";

  let rows = $state<
    Record<string, { tricksWon: number; bidRespected: boolean; bonus: number }>
  >({});
  let bidOverrides = $state<Record<string, number>>({});
  let turnExtras = $state<TurnExtra[]>([]);
  let loadedScoreKey = $state("");

  const savedRound = $derived(
    $gameStore.rounds.find((r) => r.number === $gameStore.currentRound),
  );
  const scoreBids = $derived(
    $gameStore.currentBids.length
      ? $gameStore.currentBids
      : (savedRound?.bids ?? []),
  );
  const scorePlayers = $derived(
    scoreBids
      .map((bid) => $gameStore.players.find((p) => p.id === bid.playerId))
      .filter((player) => player !== undefined),
  );
  const cardsInPlay = $derived(
    savedRound?.cardsInPlay ??
      $gameStore.meta.cardsPerRound[$gameStore.currentRound - 1] ??
      10,
  );

  function getBid(playerId: string): number {
    if (playerId in bidOverrides) return bidOverrides[playerId];
    return scoreBids.find((b) => b.playerId === playerId)?.bid ?? 0;
  }

  function adjustBid(playerId: string, delta: number) {
    const base = scoreBids.find((b) => b.playerId === playerId)?.bid ?? 0;
    const current = getBid(playerId);
    const next = Math.max(0, current + delta);
    if (next === base) {
      delete bidOverrides[playerId];
    } else {
      bidOverrides[playerId] = next;
    }
    const row = rows[playerId];
    if (row?.bidRespected) row.tricksWon = getBid(playerId);
  }

  function defaultRow(playerId: string) {
    return { tricksWon: getBid(playerId), bidRespected: true, bonus: 0 };
  }

  $effect(() => {
    const scoreKey = savedRound
      ? savedRound.scores
          .map(
            (score) =>
              `${score.playerId}:${score.bid}:${score.tricksWon}:${score.bidRespected}:${score.bonus}`,
          )
          .join(",") + JSON.stringify(savedRound.turnExtras)
      : scoreBids.map((bid) => `${bid.playerId}:${bid.bid}`).join(",");
    const nextKey = `${$gameStore.currentRound}|${scoreKey}`;

    if (nextKey === loadedScoreKey) return;

    const nextRows: typeof rows = {};
    if (savedRound) {
      for (const sc of savedRound.scores) {
        nextRows[sc.playerId] = {
          tricksWon: sc.tricksWon,
          bidRespected: sc.bidRespected,
          bonus: sc.bonus,
        };
      }
      turnExtras = [...savedRound.turnExtras];
    } else {
      for (const player of scorePlayers) {
        nextRows[player.id] = defaultRow(player.id);
      }
      turnExtras = [];
    }

    rows = nextRows;
    loadedScoreKey = nextKey;
  });

  function actualTricksWon(playerId: string): number {
    const row = rows[playerId] ?? defaultRow(playerId);
    const bid = getBid(playerId);
    return row.bidRespected ? bid : row.tricksWon;
  }

  const hasKraken = $derived(
    turnExtras.some((extra) => extra.type === "kraken"),
  );
  const everybodyPassedExtra = $derived(
    turnExtras.find((extra) => extra.type === "everybody_passed"),
  );
  const effectiveTrickCap = $derived(
    Math.max(
      0,
      cardsInPlay -
        (hasKraken ? 1 : 0) -
        (everybodyPassedExtra ? (everybodyPassedExtra.count ?? 1) : 0),
    ),
  );
  const totalActualTricks = $derived(
    scoreBids.reduce(
      (sum, bid) => sum + actualTricksWon(bid.playerId),
      0,
    ),
  );
  const trickDelta = $derived(totalActualTricks - effectiveTrickCap);

  $effect(() => {
    let changed = false;
    const nextRows = { ...rows };
    for (const player of scorePlayers) {
      if (!(player.id in nextRows)) {
        nextRows[player.id] = defaultRow(player.id);
        changed = true;
      }
    }
    if (changed) {
      rows = nextRows;
    }
  });

  function previewScore(playerId: string): number {
    const row = rows[playerId] ?? defaultRow(playerId);
    if (!row) return 0;
    const bid = getBid(playerId);
    const tricks = actualTricksWon(playerId);
    return computeRoundScore(
      bid,
      tricks,
      row.bonus,
      cardsInPlay,
      $gameStore.currentRound,
      $gameStore.meta.scoringMethod,
    );
  }

  function setBidRespected(playerId: string, respected: boolean) {
    const row = rows[playerId];
    if (!row) return;

    const bid = getBid(playerId);
    row.bidRespected = respected;

    if (respected) {
      row.tricksWon = bid;
      return;
    }

    row.tricksWon = bid === 0 ? 1 : Math.max(0, bid - 1);
  }

  function save(finishGame = false) {
    const scores: TrickScore[] = scorePlayers
      .filter((p) => scoreBids.some((b) => b.playerId === p.id))
      .map((p) => {
        const row = rows[p.id] ?? defaultRow(p.id);
        const bid = getBid(p.id);
        const tricks = actualTricksWon(p.id);
        return {
          playerId: p.id,
          bid,
          tricksWon: tricks,
          bidRespected: row.bidRespected,
          bonus: row.bonus,
          roundScore: previewScore(p.id),
        };
      });
    gameStore.saveRound(scores, turnExtras, cardsInPlay, finishGame);
  }
</script>

{#key $languageStore}
<div class="max-w-4xl mx-auto py-3 pb-20 lg:pb-3">
  <h2 class="text-xl font-bold mb-2">
    {m.scoring_title({ round: $gameStore.currentRound })}
  </h2>
  <p class="text-sm text-base-content/70 mb-2">
    {m.scoring_cards_this_round()} <span class="font-semibold">{cardsInPlay}</span>
    {#if hasKraken || everybodyPassedExtra}
      <span class="ml-2"
        >({m.scoring_effective_limit({
          limit: effectiveTrickCap,
          krakenSuffix: hasKraken ? m.scoring_kraken_suffix() : '',
          passedSuffix: everybodyPassedExtra ? m.scoring_everybody_passed_suffix({ count: everybodyPassedExtra.count ?? 1 }) : '',
        })})</span
      >
    {/if}
  </p>

  <div class="flex flex-wrap gap-2 mb-3">
    {#each scorePlayers as player (player.id)}
      {@const bid = getBid(player.id)}
      {@const row = rows[player.id]}
      {#if row}
        <div class="card bg-base-200 p-2 w-full sm:w-auto">
          <div class="grid gap-y-2">
            <div class="flex items-start justify-between gap-3">
              <span class="font-semibold min-w-24">{player.name}</span>

              <span
                class="font-bold tabular-nums text-sm"
                class:text-success={previewScore(player.id) >= 0}
                class:text-error={previewScore(player.id) < 0}
              >
                {previewScore(player.id) >= 0 ? "+" : ""}{previewScore(
                  player.id,
                )}
              </span>
            </div>

            <div
              class="grid grid-cols-[3rem_2.75rem_2.75rem_minmax(0,1fr)] items-center gap-2 min-w-0"
            >
              <span class="text-sm text-base-content/50 leading-none">{m.scoring_bid_label()}</span>
              <div class="dropdown dropdown-bottom justify-self-center">
                <button
                  type="button"
                  tabindex="0"
                  class="text-sm font-semibold tabular-nums leading-none"
                  class:text-warning={player.id in bidOverrides}
                  title={m.scoring_adjust_bid_title()}
                >
                  {bid}
                </button>
                <ul
                  class="dropdown-content menu bg-base-100 rounded-box shadow z-10 p-1 gap-1 w-28"
                >
                  <li>
                    <button
                      type="button"
                      class="btn btn-xs btn-ghost justify-start"
                      onclick={() => adjustBid(player.id, +1)}
                    >
                      {m.scoring_bid_plus1()}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      class="btn btn-xs btn-ghost justify-start"
                      disabled={bid <= 0}
                      onclick={() => adjustBid(player.id, -1)}
                    >
                      {m.scoring_bid_minus1()}
                    </button>
                  </li>
                  {#if player.id in bidOverrides}
                    <li>
                      <button
                        type="button"
                        class="btn btn-xs btn-ghost justify-start text-error"
                        onclick={() => adjustBid(player.id, -(bidOverrides[player.id] - (scoreBids.find((b) => b.playerId === player.id)?.bid ?? 0)))}
                      >
                        {m.scoring_bid_reset()}
                      </button>
                    </li>
                  {/if}
                </ul>
              </div>
              <button
                type="button"
                class="btn btn-square btn-sm min-h-11 min-w-11"
                class:btn-primary={row.bidRespected}
                class:btn-secondary={!row.bidRespected}
                aria-pressed={row.bidRespected}
                aria-label={m.scoring_toggle_bid_respected({ name: player.name })}
                onclick={() => setBidRespected(player.id, !row.bidRespected)}
              >
                {row.bidRespected ? "✓" : "✕"}
              </button>

              <div class="min-w-0 justify-self-start">
                <NumberInput
                  bind:value={row.tricksWon}
                  min={0}
                  max={effectiveTrickCap}
                  valueName={m.scoring_tricks_won_label({ name: player.name })}
                  disabled={row.bidRespected}
                />
              </div>
            </div>

            <div
              class="grid grid-cols-[3rem_2.75rem_2.75rem_minmax(0,1fr)] items-center gap-2 min-w-0"
            >
              <div class="col-span-3 flex items-center">
                <span class="text-sm text-base-content/70 leading-none"
                  >{m.scoring_bonus_label()}</span
                >
              </div>
              <div class="min-w-0 justify-self-start">
                <NumberInput
                  bind:value={row.bonus}
                  min={-500}
                  step={5}
                  max={500}
                  valueName={m.scoring_bonus_input_label({ name: player.name })}
                  disabled={false}
                />
              </div>
            </div>
          </div>
        </div>
      {/if}
    {/each}
  </div>

  <TurnExtras bind:extras={turnExtras} />

  {#if trickDelta !== 0}
    <div class="alert alert-warning mb-4">
      <span>
        {#if trickDelta > 0}
          {m.scoring_tricks_exceed({ total: totalActualTricks, limit: effectiveTrickCap, delta: Math.abs(trickDelta) })}
        {:else}
          {m.scoring_tricks_below({ total: totalActualTricks, limit: effectiveTrickCap, delta: Math.abs(trickDelta) })}
        {/if}
        {#if hasKraken}
          <br />
          {m.scoring_kraken_note()}
        {/if}
        {#if everybodyPassedExtra}
          <br />
          {m.scoring_everybody_passed_note({ count: everybodyPassedExtra.count ?? 1 })}
        {/if}
      </span>
    </div>
  {/if}

  {#if $canGoBack || $canGoForward}
    <div class="flex gap-2 mt-2">
      {#if $canGoBack}
        <button class="btn btn-ghost btn-sm flex-1" onclick={() => gameStore.goBack()}
          >{m.nav_back()}</button
        >
      {/if}
      {#if $canGoForward}
        <button class="btn btn-ghost btn-sm flex-1" onclick={() => gameStore.goForward()}
          >{m.nav_forward()}</button
        >
      {/if}
    </div>
  {/if}
  <div class="flex gap-2 mt-2">
    <button class="btn btn-primary flex-1" onclick={() => save()}
      >{m.scoring_save()}</button
    >
    <button class="btn btn-warning" onclick={() => save(true)}>{m.scoring_end_now()}</button>
  </div>
</div>
{/key}
