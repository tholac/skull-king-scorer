<script lang="ts">
  import { gameStore, activePlayers } from "$lib/store/gameStore";
  import TurnExtras from "./TurnExtras.svelte";
  import { computeRoundScore } from "$lib/game/scoring";
  import type { TrickScore, TurnExtra } from "$lib/game/types";
  import NumberInput from "../shared/NumberInput.svelte";
  import BonusHelpPopup from "../shared/BonusHelpPopup.svelte";

  const cardsInPlay = $derived(
    $gameStore.meta.cardsPerRound[$gameStore.currentRound - 1] ?? 10,
  );

  let rows = $state<
    Record<string, { tricksWon: number; bidRespected: boolean; bonus: number }>
  >({});
  let turnExtras = $state<TurnExtra[]>([]);

  function getBid(playerId: string): number {
    return (
      $gameStore.currentBids.find((b) => b.playerId === playerId)?.bid ?? 0
    );
  }

  function defaultRow(playerId: string) {
    return { tricksWon: getBid(playerId), bidRespected: true, bonus: 0 };
  }

  function actualTricksWon(playerId: string): number {
    const row = rows[playerId] ?? defaultRow(playerId);
    const bid = getBid(playerId);
    return row.bidRespected ? bid : row.tricksWon;
  }

  const hasKraken = $derived(
    turnExtras.some((extra) => extra.type === "kraken"),
  );
  const effectiveTrickCap = $derived(
    Math.max(0, cardsInPlay - (hasKraken ? 1 : 0)),
  );
  const totalActualTricks = $derived(
    $gameStore.currentBids.reduce(
      (sum, bid) => sum + actualTricksWon(bid.playerId),
      0,
    ),
  );
  const trickDelta = $derived(totalActualTricks - effectiveTrickCap);

  $effect(() => {
    let changed = false;
    const nextRows = { ...rows };
    for (const player of $activePlayers) {
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

  function save() {
    const scores: TrickScore[] = $activePlayers
      .filter((p) => $gameStore.currentBids.some((b) => b.playerId === p.id))
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
    gameStore.saveRound(scores, turnExtras, cardsInPlay);
  }
</script>

<div class="max-w-lg mx-auto py-6 px-4">
  <h2 class="text-xl font-bold mb-4">
    Round {$gameStore.currentRound} — Scores
  </h2>
  <p class="text-sm text-base-content/70 mb-3">
    Cards this round: <span class="font-semibold">{cardsInPlay}</span>
    {#if hasKraken}
      <span class="ml-2"
        >(Kraken active: effective tricks limit {effectiveTrickCap})</span
      >
    {/if}
  </p>

  <div class="space-y-3 mb-4">
    {#each $activePlayers as player (player.id)}
      {@const bid = getBid(player.id)}
      {@const row = rows[player.id]}
      {#if row}
        <div class="card bg-base-200 p-3">
          <div class="grid gap-y-3">
            <div class="flex items-start justify-between gap-3">
              <span class="font-semibold min-w-24">{player.name}</span>

              <span
                class="font-bold tabular-nums text-sm"
                class:text-success={previewScore(player.id) >= 0}
                class:text-error={previewScore(player.id) < 0}
              >
                {previewScore(player.id) >= 0 ? "+" : ""}{previewScore(player.id)}
              </span>
            </div>

            <div class="grid grid-cols-[4rem_2.75rem_2.75rem_minmax(0,1fr)] items-center gap-3 min-w-0">
              <span class="text-sm text-base-content/50 leading-none">Bid</span>
              <span class="text-sm font-semibold tabular-nums leading-none justify-self-center">
                {bid}
              </span>
              <button
                type="button"
                class="btn btn-square btn-sm min-h-11 min-w-11"
                class:btn-primary={row.bidRespected}
                class:btn-secondary={!row.bidRespected}
                aria-pressed={row.bidRespected}
                aria-label={`Toggle whether ${player.name} respected the bid`}
                onclick={() => setBidRespected(player.id, !row.bidRespected)}
              >
                {row.bidRespected ? "✓" : "✕"}
              </button>

              <div class="min-w-0 justify-self-start">
                <NumberInput
                  bind:value={row.tricksWon}
                  min={0}
                  max={effectiveTrickCap}
                  valueName={`${player.name}'s tricks won`}
                  disabled={row.bidRespected}
                />
              </div>
            </div>

            <div class="grid grid-cols-[4rem_2.75rem_2.75rem_minmax(0,1fr)] items-center gap-3 min-w-0">
              <span class="text-sm text-base-content/70 leading-none">Bonus</span>
              <div aria-hidden="true" class="h-11 w-11"></div>
              <div aria-hidden="true" class="h-11 w-11"></div>
              <div class="flex items-center gap-3 min-w-0 justify-self-start">
                <NumberInput
                  bind:value={row.bonus}
                  min={-500}
                  step={5}
                  max={500}
                  valueName={`${player.name}'s bonus`}
                />
                <BonusHelpPopup />
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
        ⚠️ Total tricks entered ({totalActualTricks})
        {#if trickDelta > 0}
          exceed
        {:else}
          are below
        {/if}
        round limit ({effectiveTrickCap}) by {Math.abs(trickDelta)}.
        {#if hasKraken}
          Kraken is active, so one trick is removed from the round total.{/if}
      </span>
    </div>
  {/if}

  <button class="btn btn-primary w-full mt-2" onclick={save}
    >Save round ✓</button
  >
</div>
