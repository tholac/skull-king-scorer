<script lang="ts">
  import { untrack } from 'svelte';
  import { getRuleset } from '$lib/game/rules/index';
  import { gameStore } from '$lib/store/gameStore';
  import type { TurnExtra } from '$lib/game/types';
  import NumberInput from '$lib/components/shared/NumberInput.svelte';

  let { extras = $bindable([]) }: { extras: TurnExtra[] } = $props();

  const defs = $derived(getRuleset($gameStore.meta.ruleset).extras);

  const everybodyPassedChecked = $derived(extras.some((e) => e.type === 'everybody_passed'));

  let passedCount = $state(1);

  // Sync passedCount → extras (one-way, no loop via untrack)
  $effect(() => {
    const count = passedCount;
    untrack(() => {
      extras = extras.map((e) => (e.type === 'everybody_passed' ? { ...e, count } : e));
    });
  });

  function toggle(type: string, checked: boolean) {
    if (checked) {
      extras = [...extras, { type }];
    } else {
      extras = extras.filter((e) => e.type !== type);
    }
  }

  function isChecked(type: string) {
    return extras.some((e) => e.type === type);
  }

  function toggleEverybodyPassed(checked: boolean) {
    if (checked) {
      extras = [...extras, { type: 'everybody_passed', count: passedCount }];
    } else {
      extras = extras.filter((e) => e.type !== 'everybody_passed');
    }
  }
</script>

<div class="mb-4 p-3 bg-base-200 rounded-lg">
  <h3 class="text-sm font-semibold mb-2 text-base-content/70">Turn events</h3>
  <div class="flex flex-wrap gap-3 items-center">
    {#each defs as def}
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          checked={isChecked(def.type)}
          onchange={(e) => toggle(def.type, (e.target as HTMLInputElement).checked)}
        />
        <span class="text-sm">{def.icon} {def.label}</span>
      </label>
    {/each}

    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        class="checkbox checkbox-sm"
        checked={everybodyPassedChecked}
        onchange={(e) => toggleEverybodyPassed((e.target as HTMLInputElement).checked)}
      />
      <span class="text-sm">🤝 Everybody passed</span>
    </label>

    {#if everybodyPassedChecked}
      <div class="flex items-center gap-2">
        <span class="text-xs text-base-content/60">× times:</span>
        <NumberInput bind:value={passedCount} min={1} max={99} valueName="everybody passed count" />
      </div>
    {/if}
  </div>
</div>
