<script lang="ts">
  import { gameStore } from '$lib/store/gameStore';
  import TimelineEventComponent from './TimelineEvent.svelte';
</script>

<div class="p-3">
  <h2 class="font-bold text-sm uppercase tracking-wider text-base-content/60 mb-2">Timeline</h2>
  <ul class="space-y-0.5">
    {#each [...$gameStore.timeline].reverse() as event (event.timestamp)}
      <TimelineEventComponent {event} />
    {/each}
  </ul>
</div>
