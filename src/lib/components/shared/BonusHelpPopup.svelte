<script lang="ts">
  import { getRuleset } from '$lib/game/rules/index';
  import { gameStore } from '$lib/store/gameStore';
  import * as m from '$lib/paraglide/messages.js';
  import { languageStore } from '$lib/store/languageStore.js';
  const bonuses = $derived(getRuleset($gameStore.meta.ruleset).bonuses);
</script>

{#key $languageStore}
<div class="dropdown dropdown-end">
  <button tabindex="0" class="btn btn-ghost btn-xs" aria-label={m.bonus_help_label()}>❓</button>
  <div class="dropdown-content z-50 card card-compact shadow-lg bg-base-200 w-64 p-3 mt-1">
    <table class="table table-xs">
      <thead><tr><th>{m.bonus_table_bonus()}</th><th class="text-right">{m.bonus_table_pts()}</th></tr></thead>
      <tbody>
        {#each bonuses as b}
          <tr><td>{b.label}</td><td class="text-right tabular-nums">{b.points}</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
{/key}
