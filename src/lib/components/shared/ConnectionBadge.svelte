<script lang="ts">
  import { peerStore } from '$lib/store/peerStore';
</script>

{#if $peerStore.status !== 'disconnected'}
  <div class="badge badge-sm gap-1">
    {#if $peerStore.status === 'connected'}
      <span class="text-success">🟢</span>
      {#if $peerStore.guestCount > 0}
        {$peerStore.guestCount} guest{$peerStore.guestCount > 1 ? 's' : ''}
      {:else}
        Connected
      {/if}
    {:else if $peerStore.status === 'connecting'}
      <span class="loading loading-ring loading-xs"></span> Connecting…
    {:else}
      <span class="text-error">🔴</span> Disconnected
    {/if}
  </div>
{/if}
