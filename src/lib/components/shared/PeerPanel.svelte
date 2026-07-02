<script lang="ts">
  import { gameStore } from '$lib/store/gameStore';
  import { peerStore } from '$lib/store/peerStore';
  import * as m from '$lib/paraglide/messages.js';
  import { languageStore } from '$lib/store/languageStore.js';

  let guestRoomId = $state('');
  let showPanel = $state(false);

  async function host() {
    const roomId = await peerStore.startAsHost($gameStore.id);
    gameStore.setPeerRole('host', roomId);
    // broadcast current state to any guests who join later
    peerStore.broadcastState($gameStore);
  }

  async function join() {
    if (!guestRoomId.trim()) return;
    await peerStore.joinAsGuest(guestRoomId.trim(), (state) => {
      gameStore.hydrateFromPeer(state);
    });
    gameStore.setPeerRole('guest', guestRoomId.trim());
  }

  function stop() {
    peerStore.disconnect();
    gameStore.setPeerRole('solo', null);
  }
</script>

{#key $languageStore}
<div class="relative">
  <button class="btn btn-ghost btn-sm" onclick={() => (showPanel = !showPanel)}>
    {m.nav_share()}
  </button>

  {#if showPanel}
    <div class="absolute right-0 top-10 z-50 card bg-base-200 shadow-xl w-72 p-4">
      {#if $gameStore.peer.role === 'solo'}
        <p class="text-sm font-semibold mb-3">{m.peer_title()}</p>
        <button class="btn btn-primary btn-sm mb-2 w-full" onclick={host}>
          {m.peer_host_button()}
        </button>
        <div class="divider text-xs">{m.peer_join_divider()}</div>
        <div class="flex gap-2">
          <input
            class="input input-bordered input-sm flex-1"
            bind:value={guestRoomId}
            placeholder={m.peer_room_placeholder()}
            maxlength="9"
          />
          <button class="btn btn-sm btn-outline" onclick={join}>{m.peer_join_button()}</button>
        </div>

      {:else if $gameStore.peer.role === 'host'}
        <p class="text-sm font-semibold mb-1">{m.peer_hosting_title()}</p>
        <p class="font-mono text-2xl text-center tracking-widest my-2">{$gameStore.peer.roomId}</p>
        <p class="text-xs text-base-content/50 text-center mb-3">{m.peer_share_code_hint()}</p>
        <button class="btn btn-ghost btn-xs w-full" onclick={stop}>{m.peer_stop_sharing()}</button>

      {:else}
        <p class="text-sm font-semibold mb-1">{m.peer_watching_title({ roomId: $gameStore.peer.roomId ?? '' })}</p>
        <p class="text-xs text-base-content/50 mb-3">{m.peer_readonly_hint()}</p>
        <button class="btn btn-ghost btn-xs w-full" onclick={stop}>{m.peer_leave()}</button>
      {/if}
    </div>
  {/if}
</div>
{/key}
