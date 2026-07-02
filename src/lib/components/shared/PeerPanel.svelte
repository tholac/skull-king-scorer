<script lang="ts">
  import { gameStore } from '$lib/store/gameStore';
  import { peerStore } from '$lib/store/peerStore';

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

<div class="relative">
  <button class="btn btn-ghost btn-sm" onclick={() => (showPanel = !showPanel)}>
    📡 Share
  </button>

  {#if showPanel}
    <div class="absolute right-0 top-10 z-50 card bg-base-200 shadow-xl w-72 p-4">
      {#if $gameStore.peer.role === 'solo'}
        <p class="text-sm font-semibold mb-3">Live score sharing</p>
        <button class="btn btn-primary btn-sm mb-2 w-full" onclick={host}>
          Host — share my game
        </button>
        <div class="divider text-xs">or join</div>
        <div class="flex gap-2">
          <input
            class="input input-bordered input-sm flex-1"
            bind:value={guestRoomId}
            placeholder="Room ID"
            maxlength="9"
          />
          <button class="btn btn-sm btn-outline" onclick={join}>Join</button>
        </div>

      {:else if $gameStore.peer.role === 'host'}
        <p class="text-sm font-semibold mb-1">Hosting</p>
        <p class="font-mono text-2xl text-center tracking-widest my-2">{$gameStore.peer.roomId}</p>
        <p class="text-xs text-base-content/50 text-center mb-3">Share this code with guests</p>
        <button class="btn btn-ghost btn-xs w-full" onclick={stop}>Stop sharing</button>

      {:else}
        <p class="text-sm font-semibold mb-1">Watching: {$gameStore.peer.roomId}</p>
        <p class="text-xs text-base-content/50 mb-3">Read-only mode — host controls the game</p>
        <button class="btn btn-ghost btn-xs w-full" onclick={stop}>Leave</button>
      {/if}
    </div>
  {/if}
</div>
