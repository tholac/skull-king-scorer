<script lang="ts">
  import type { Snippet } from 'svelte';
  let { timeline, main, scoreboard }: {
    timeline: Snippet;
    main: Snippet;
    scoreboard: Snippet;
  } = $props();
</script>

<div class="h-full flex overflow-hidden">
  <aside class="hidden lg:flex lg:w-1/5 flex-col border-r border-base-300 overflow-y-auto">
    {@render timeline()}
  </aside>

  <section class="flex-1 lg:w-3/5 overflow-y-auto p-4">
    {@render main()}
  </section>

  <aside class="hidden lg:flex lg:w-1/5 flex-col border-l border-base-300 overflow-y-auto">
    {@render scoreboard()}
  </aside>
</div>
