<script lang="ts">
  import { getRuleset } from '$lib/game/rules/index';
  import { gameStore } from '$lib/store/gameStore';
  const bonuses = $derived(getRuleset($gameStore.meta.ruleset).bonuses);
</script>

<div class="dropdown dropdown-end">
  <button tabindex="0" class="btn btn-ghost btn-xs" aria-label="Bonus help">❓</button>
  <div class="dropdown-content z-50 card card-compact shadow-lg bg-base-200 w-64 p-3 mt-1">
    <table class="table table-xs">
      <thead><tr><th>Bonus</th><th class="text-right">Pts</th></tr></thead>
      <tbody>
        {#each bonuses as b}
          <tr><td>{b.label}</td><td class="text-right tabular-nums">{b.points}</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
