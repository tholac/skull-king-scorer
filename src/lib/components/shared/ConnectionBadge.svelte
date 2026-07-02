<script lang="ts">
  import { peerStore } from '$lib/store/peerStore';
  import * as m from '$lib/paraglide/messages.js';
  import { languageStore } from '$lib/store/languageStore.js';
</script>

{#key $languageStore}
{#if $peerStore.status !== 'disconnected'}
  <div class="badge badge-sm gap-1">
    {#if $peerStore.status === 'connected'}
      <span class="text-success">🟢</span>
      {#if $peerStore.guestCount > 0}
        {$peerStore.guestCount > 1 ? m.connection_guests_plural({ count: $peerStore.guestCount }) : m.connection_guests({ count: $peerStore.guestCount })}
      {:else}
        {m.connection_connected()}
      {/if}
    {:else if $peerStore.status === 'connecting'}
      <span class="loading loading-ring loading-xs"></span> {m.connection_connecting()}
    {:else}
      <span class="text-error">🔴</span> {m.connection_disconnected()}
    {/if}
  </div>
{/if}
{/key}
