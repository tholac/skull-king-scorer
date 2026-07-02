<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
  let open = $state(false);
</script>

<div class="lg:hidden fixed bottom-6 right-4 z-50">
  <button class="btn btn-primary btn-circle shadow-lg" onclick={() => (open = true)}>
    🏆
  </button>
</div>

{#if open}
  <div
    class="lg:hidden fixed inset-0 z-50 flex flex-col justify-end"
    role="dialog"
    aria-modal="true"
  >
    <button
      class="absolute inset-0 bg-black/50"
      onclick={() => (open = false)}
      aria-label="Close scoreboard"
    ></button>
    <div class="relative bg-base-100 rounded-t-2xl max-h-[80vh] overflow-y-auto p-4">
      <button class="btn btn-ghost btn-sm absolute top-2 right-2" onclick={() => (open = false)}>✕</button>
      {@render children()}
    </div>
  </div>
{/if}
