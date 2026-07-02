<script lang="ts">
  import BonusHelpPopup from '$lib/components/shared/BonusHelpPopup.svelte';
  let { value = $bindable(0) }: { value: number } = $props();
</script>

<div class="flex items-center gap-1">
  <button class="btn btn-ghost btn-xs" onclick={() => (value -= 5)}>−</button>
  <span class="tabular-nums w-10 text-center text-sm font-mono">
    {value >= 0 ? `+${value}` : value}
  </span>
  <button class="btn btn-ghost btn-xs" onclick={() => (value += 5)}>+</button>
  <BonusHelpPopup />
</div>
