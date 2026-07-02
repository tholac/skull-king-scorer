<script lang="ts">
  import { getRuleset } from '$lib/game/rules/index';
  import { gameStore } from '$lib/store/gameStore';
  import type { TurnExtra } from '$lib/game/types';

  let { extras = $bindable([]) }: { extras: TurnExtra[] } = $props();

  const defs = $derived(getRuleset($gameStore.meta.ruleset).extras);

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
</script>

{#if defs.length > 0}
  <div class="mb-4 p-3 bg-base-200 rounded-lg">
    <h3 class="text-sm font-semibold mb-2 text-base-content/70">Turn events</h3>
    <div class="flex flex-wrap gap-3">
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
    </div>
  </div>
{/if}
