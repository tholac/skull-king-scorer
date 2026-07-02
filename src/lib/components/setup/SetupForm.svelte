<script lang="ts">
  import { gameStore } from '$lib/store/gameStore';
  import { getRuleset } from '$lib/game/rules/index';
  import { largeGroupWarning } from '$lib/game/roundUtils';
  import AddPlayerModal from './AddPlayerModal.svelte';
  import type { RulesetId, ScoringMethod } from '$lib/game/types';
  import * as m from '$lib/paraglide/messages.js';
  import { languageStore } from '$lib/store/languageStore.js';

  let playerNames = $state<string[]>(['', '']);
  let ruleset = $state<RulesetId>('base');
  let scoringMethod = $state<ScoringMethod>('classic');
  let modalOpen = $state(false);

  const warning = $derived(largeGroupWarning(
    playerNames.filter(Boolean).length,
    getRuleset(ruleset).deckSize,
  ));

  function addRow() { playerNames = [...playerNames, '']; }
  function removeRow(i: number) { playerNames = playerNames.filter((_, idx) => idx !== i); }

  function start() {
    const names = playerNames.map((n) => n.trim()).filter(Boolean);
    if (names.length < 2) return;
    gameStore.startGame(names, ruleset, scoringMethod);
  }
</script>

{#key $languageStore}
<div class="max-w-lg mx-auto py-8 px-4">
  <h1 class="text-3xl font-bold mb-6">{m.setup_title()}</h1>

  <section class="mb-6">
    <h2 class="font-semibold mb-2">{m.setup_players()}</h2>
    {#each playerNames as _, i}
      <div class="flex gap-2 mb-2">
        <input
          class="input input-bordered flex-1"
          bind:value={playerNames[i]}
          placeholder={m.setup_player_placeholder({ n: i + 1 })}
        />
        {#if playerNames.length > 2}
          <button class="btn btn-ghost btn-sm" onclick={() => removeRow(i)}>🗑️</button>
        {/if}
      </div>
    {/each}
    <button class="btn btn-ghost btn-sm mt-1" onclick={addRow}>{m.setup_add_player()}</button>
  </section>

  {#if warning}
    <div class="alert alert-warning mb-4 text-sm">⚠️ {warning}</div>
  {/if}

  <section class="mb-4">
    <h2 class="font-semibold mb-2">{m.setup_ruleset()}</h2>
    <div class="join">
      {#each (['base', 'extended'] as const) as r}
        <button
          class="btn join-item"
          class:btn-primary={ruleset === r}
          onclick={() => (ruleset = r)}
        >{getRuleset(r).label}</button>
      {/each}
    </div>
  </section>

  <section class="mb-6">
    <h2 class="font-semibold mb-2">{m.setup_scoring_method()}</h2>
    <div class="join">
      {#each (['classic', 'rascal'] as const) as method}
        <button
          class="btn join-item"
          class:btn-primary={scoringMethod === method}
          onclick={() => (scoringMethod = method)}
        >{method === 'classic' ? m.scoring_method_classic() : m.scoring_method_rascal()}</button>
      {/each}
    </div>
  </section>

  <button
    class="btn btn-primary w-full"
    disabled={playerNames.filter(Boolean).length < 2}
    onclick={start}
  >{m.setup_start_game()}</button>
</div>
{/key}
