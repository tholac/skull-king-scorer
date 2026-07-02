<script lang="ts">
  import SetupForm from '$lib/components/setup/SetupForm.svelte';
  import BiddingForm from '$lib/components/bidding/BiddingForm.svelte';
  import ScoringForm from '$lib/components/scoring/ScoringForm.svelte';
  import GameOver from '$lib/components/GameOver.svelte';
  import Scoreboard from '$lib/components/scoreboard/Scoreboard.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import Shell from '$lib/components/layout/Shell.svelte';
  import ThreePanelLayout from '$lib/components/layout/ThreePanelLayout.svelte';
  import MobileScoreDrawer from '$lib/components/layout/MobileScoreDrawer.svelte';
  import { gameStore } from '$lib/store/gameStore';
  import { peerStore } from '$lib/store/peerStore';

  $effect(() => {
    if ($gameStore.peer.role === 'host') {
      peerStore.broadcastState($gameStore);
    }
  });
</script>

<Shell>
  <ThreePanelLayout>
    {#snippet timeline()}
      <Timeline />
    {/snippet}

    {#snippet main()}
      {#if $gameStore.phase === 'setup'}
        <SetupForm />
      {:else if $gameStore.phase === 'bidding'}
        <BiddingForm />
      {:else if $gameStore.phase === 'scoring'}
        <ScoringForm />
      {:else if $gameStore.phase === 'gameover'}
        <GameOver />
      {/if}
    {/snippet}

    {#snippet scoreboard()}
      <Scoreboard />
    {/snippet}
  </ThreePanelLayout>

  <MobileScoreDrawer>
    {#snippet children()}
      <Scoreboard />
    {/snippet}
  </MobileScoreDrawer>
</Shell>
