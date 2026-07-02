<script lang="ts">
  import type { Snippet } from 'svelte';
  let { timeline, main, scoreboard, hideRight = false }: {
    timeline: Snippet;
    main: Snippet;
    scoreboard: Snippet;
    hideRight?: boolean;
  } = $props();

  const MIN_PCT = 10;
  const MAX_PCT = 40;

  let leftPct = $state(20);
  let rightPct = $state(20);

  let dragging: 'left' | 'right' | null = null;
  let startX = 0;
  let startPct = 0;
  let containerWidth = 0;

  let containerEl: HTMLDivElement;

  function startDrag(side: 'left' | 'right', e: MouseEvent) {
    dragging = side;
    startX = e.clientX;
    startPct = side === 'left' ? leftPct : rightPct;
    containerWidth = containerEl.offsetWidth;
    e.preventDefault();
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragging || containerWidth === 0) return;
    const dx = e.clientX - startX;
    const deltaPct = (dx / containerWidth) * 100;
    const newPct = Math.min(MAX_PCT, Math.max(MIN_PCT, startPct + (dragging === 'left' ? deltaPct : -deltaPct)));
    if (dragging === 'left') leftPct = newPct;
    else rightPct = newPct;
  }

  function stopDrag() {
    dragging = null;
  }
</script>

<svelte:document onmousemove={onMouseMove} onmouseup={stopDrag} />

<div class="h-full flex overflow-hidden" bind:this={containerEl}>
  <aside
    class="hidden lg:flex flex-col border-r border-base-300 overflow-y-auto"
    style="width: {leftPct}%"
  >
    {@render timeline()}
  </aside>

  <!-- Left drag handle -->
  <button
    type="button"
    class="hidden lg:block w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 shrink-0 transition-colors border-none bg-transparent p-0"
    aria-label="Resize timeline panel"
    onmousedown={(e) => startDrag('left', e)}
  ></button>

  <section class="flex-1 overflow-y-auto p-4 min-w-0">
    {@render main()}
  </section>

  {#if !hideRight}
  <!-- Right drag handle -->
  <button
    type="button"
    class="hidden lg:block w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 shrink-0 transition-colors border-none bg-transparent p-0"
    aria-label="Resize scoreboard panel"
    onmousedown={(e) => startDrag('right', e)}
  ></button>

  <aside
    class="hidden lg:flex flex-col border-l border-base-300 overflow-y-auto"
    style="width: {rightPct}%"
  >
    {@render scoreboard()}
  </aside>
  {/if}
</div>
