<script lang="ts">
  import { untrack } from 'svelte';
  import type { Player } from '$lib/game/types';
  import { suggestInitialScore, type ScorePreset } from '$lib/game/playerUtils';
  import * as m from '$lib/paraglide/messages.js';
  import { languageStore } from '$lib/store/languageStore.js';

  type ModalPreset = ScorePreset | 'manual';

  let { open = $bindable(false), activePlayers, midGame = false, onAdd, onEdit, editPlayer }: {
    open: boolean;
    activePlayers: Player[];
    midGame?: boolean;
    onAdd?: (name: string, score: ScorePreset | number) => void;
    onEdit?: (name: string, scoreOffset: number) => void;
    editPlayer?: { name: string; scoreOffset: number } | null;
  } = $props();

  let name = $state('');
  let preset = $state<ModalPreset>('average');
  let manualScore = $state(0);

  // Seed fields only when the modal transitions from closed → open.
  // untrack prevents editPlayer reads from re-running this when the store updates mid-session.
  $effect(() => {
    if (open) {
      untrack(() => {
        if (editPlayer) {
          name = editPlayer.name;
          preset = 'manual';
          manualScore = editPlayer.scoreOffset;
        } else {
          name = '';
          preset = 'average';
          manualScore = 0;
        }
      });
    }
  });

  const isEditMode = $derived(!!editPlayer);

  const suggested = $derived(
    preset !== 'manual'
      ? suggestInitialScore(preset, activePlayers)
      : manualScore,
  );

  function submit() {
    if (!name.trim()) return;
    if (isEditMode) {
      onEdit?.(name.trim(), preset === 'manual' ? manualScore : suggestInitialScore(preset as ScorePreset, activePlayers));
    } else {
      const score: ScorePreset | number = !midGame
        ? 'zero'
        : preset === 'manual'
          ? manualScore
          : preset;
      onAdd?.(name.trim(), score);
    }
    open = false;
  }
</script>

{#if open}
  {#key $languageStore}
  <dialog class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">{isEditMode ? m.modal_edit_player_title() : m.modal_add_player_title()}</h3>

      <label class="form-control mb-3">
        <div class="label"><span class="label-text">{m.modal_name_label()}</span></div>
        <input class="input input-bordered" bind:value={name} placeholder={m.modal_player_name_placeholder()} />
      </label>

      {#if midGame || isEditMode}
        <div class="mb-3">
          <div class="label"><span class="label-text">{m.modal_starting_score_label()}</span></div>
          <div class="join">
            {#each (['zero', 'average', 'median', 'manual'] as const) as p}
              <button
                class="btn join-item btn-sm"
                class:btn-primary={preset === p}
                onclick={() => { preset = p; }}
              >{p === 'zero' ? m.modal_preset_zero() : p === 'average' ? m.modal_preset_average() : p === 'median' ? m.modal_preset_median() : m.modal_preset_manual()}</button>
            {/each}
          </div>
          {#if preset === 'manual'}
            <input class="input input-bordered input-sm mt-2 w-full" type="number" bind:value={manualScore} />
          {:else}
            <p class="text-sm text-base-content/60 mt-1">{m.modal_score_label({ score: suggested })}</p>
          {/if}
        </div>
      {/if}

      <div class="modal-action">
        <button class="btn btn-ghost" onclick={() => (open = false)}>{m.modal_cancel()}</button>
        <button class="btn btn-primary" onclick={submit} disabled={!name.trim()}>
          {isEditMode ? m.modal_save() : m.modal_add()}
        </button>
      </div>
    </div>
    <button class="modal-backdrop" onclick={() => (open = false)} aria-label="Close"></button>
  </dialog>
  {/key}
{/if}
