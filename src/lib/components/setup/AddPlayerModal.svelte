<script lang="ts">
  import type { Player } from '$lib/game/types';
  import { suggestInitialScore, type ScorePreset } from '$lib/game/playerUtils';

  type ModalPreset = ScorePreset | 'manual';

  let { open = $bindable(false), activePlayers, midGame = false, onAdd }: {
    open: boolean;
    activePlayers: Player[];
    midGame?: boolean;
    onAdd: (name: string, score: ScorePreset | number) => void;
  } = $props();

  let name = $state('');
  let preset = $state<ModalPreset>('average');
  let manualScore = $state(0);

  const suggested = $derived(
    preset !== 'manual'
      ? suggestInitialScore(preset, activePlayers)
      : manualScore,
  );

  function submit() {
    if (!name.trim()) return;
    const score: ScorePreset | number = !midGame
      ? 'zero'
      : preset === 'manual'
        ? manualScore
        : preset;
    onAdd(name.trim(), score);
    name = '';
    preset = 'average';
    manualScore = 0;
    open = false;
  }
</script>

{#if open}
  <dialog class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Add player</h3>

      <label class="form-control mb-3">
        <div class="label"><span class="label-text">Name</span></div>
        <input class="input input-bordered" bind:value={name} placeholder="Player name" />
      </label>

      {#if midGame}
        <div class="mb-3">
          <div class="label"><span class="label-text">Starting score</span></div>
          <div class="join">
            {#each (['zero', 'average', 'median', 'manual'] as const) as p}
              <button
                class="btn join-item btn-sm"
                class:btn-primary={preset === p}
                onclick={() => { preset = p; }}
              >{p}</button>
            {/each}
          </div>
          {#if preset === 'manual'}
            <input class="input input-bordered input-sm mt-2 w-full" type="number" bind:value={manualScore} />
          {:else}
            <p class="text-sm text-base-content/60 mt-1">Score: {suggested}</p>
          {/if}
        </div>
      {/if}

      <div class="modal-action">
        <button class="btn btn-ghost" onclick={() => (open = false)}>Cancel</button>
        <button class="btn btn-primary" onclick={submit} disabled={!name.trim()}>Add</button>
      </div>
    </div>
    <button class="modal-backdrop" onclick={() => (open = false)} aria-label="Close"></button>
  </dialog>
{/if}
