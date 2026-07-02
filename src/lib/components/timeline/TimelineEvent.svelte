<script lang="ts">
  import type { TimelineEvent } from '$lib/game/types';
  let { event }: { event: TimelineEvent } = $props();
  let expanded = $state(false);

  const icons: Record<string, string> = {
    game_start: '🏴‍☠️',
    round_start: '⚓',
    round_end: '☠️',
    player_joined: '🌊',
    player_removed: '🌊',
    turn_extra: '⛈️',
  };

  const icon = $derived(icons[event.type] ?? '📌');

  const label = $derived((() => {
    switch (event.type) {
      case 'game_start': return 'Game started';
      case 'round_start': return `Round ${event.round} — ${(event.payload as { cards: number }).cards} cards`;
      case 'round_end': return `Round ${event.round} complete`;
      case 'player_joined': return `${(event.payload as { name: string }).name} joined`;
      case 'player_removed': return `${(event.payload as { name: string }).name} left`;
      case 'turn_extra': return String(event.payload.type ?? 'Event');
      default: return event.type;
    }
  })());
</script>

<li class="flex gap-2 text-xs py-1">
  <span class="shrink-0 w-5 text-center">{icon}</span>
  <button
    class="text-left text-base-content/80 hover:text-base-content transition-colors"
    onclick={() => (expanded = !expanded)}
  >
    {label}
    {#if event.type === 'round_end' && expanded}
      <div class="mt-1 text-base-content/50">
        {#each (event.payload.scores as Array<{ playerId: string; roundScore: number }>) as s}
          <div>{s.playerId}: {s.roundScore >= 0 ? `+${s.roundScore}` : s.roundScore}</div>
        {/each}
      </div>
    {/if}
  </button>
</li>
