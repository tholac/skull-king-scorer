import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import type {
  GameState,
  Player,
  Bid,
  TrickScore,
  TurnExtra,
  TimelineEvent,
} from "$lib/game/types";
import { computeCardsPerRound } from "$lib/game/roundUtils";
import { computeRoundScore } from "$lib/game/scoring";
import { getRuleset } from "$lib/game/rules/index";
import { suggestInitialScore, type ScorePreset } from "$lib/game/playerUtils";

const STORAGE_KEY = "skore-king-state";

function makeId(): string {
  return globalThis.crypto.randomUUID();
}

function defaultState(): GameState {
  return {
    id: makeId(),
    meta: {
      ruleset: "base",
      scoringMethod: "classic",
      totalRounds: 10,
      cardsPerRound: Array.from({ length: 10 }, (_, i) => i + 1),
    },
    phase: "setup",
    currentRound: 1,
    players: [],
    rounds: [],
    currentBids: [],
    timeline: [],
    peer: { role: "solo", roomId: null },
  };
}

function loadState(): GameState {
  if (!browser) return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeTimelineIds(JSON.parse(raw) as GameState);
  } catch {
    return defaultState();
  }
}

function getNextTimelineId(timeline: TimelineEvent[]): number {
  let maxId = -1;
  for (const event of timeline) {
    if (Number.isFinite(event.id) && event.id > maxId) {
      maxId = event.id;
    }
  }
  return maxId + 1;
}

function normalizeTimelineIds(state: GameState): GameState {
  if (state.timeline.length === 0) return state;

  const usedIds = new Set<number>();
  let nextId = 0;
  let changed = false;

  const timeline = state.timeline.map((event) => {
    const hasValidId = Number.isFinite(event.id);
    let id = hasValidId ? event.id : -1;

    if (!hasValidId || usedIds.has(id)) {
      while (usedIds.has(nextId)) nextId += 1;
      id = nextId;
      changed = true;
    }

    usedIds.add(id);
    if (id >= nextId) nextId = id + 1;

    return hasValidId && event.id === id ? event : { ...event, id };
  });

  return changed ? { ...state, timeline } : state;
}

function recomputeTotalScores(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      totalScore:
        p.scoreOffset +
        state.rounds.reduce((sum, round) => {
          const score = round.scores.find((s) => s.playerId === p.id);
          return sum + (score?.roundScore ?? 0);
        }, 0),
    })),
  };
}

type AppendEvent = Omit<Omit<TimelineEvent, "id">, "timestamp">;

function appendEvent(state: GameState, event: AppendEvent): GameState {
  const id = getNextTimelineId(state.timeline);
  console.debug("Appending timeline event", { id, ...event });
  return {
    ...state,
    timeline: [...state.timeline, { ...event, id, timestamp: Date.now() }],
  };
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(state: GameState) {
  if (!browser) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, 200);
}

const _store = writable<GameState>(loadState());

_store.subscribe(scheduleSave);

function update(fn: (s: GameState) => GameState) {
  _store.update(fn);
}

export const gameStore = {
  subscribe: _store.subscribe,

  startGame(
    playerNames: string[],
    ruleset: GameState["meta"]["ruleset"],
    scoringMethod: GameState["meta"]["scoringMethod"],
  ) {
    update(() => {
      const r = getRuleset(ruleset);
      const cardsPerRound = computeCardsPerRound(
        playerNames.length,
        r.deckSize,
      );
      const players: Player[] = playerNames.map((name) => ({
        id: makeId(),
        name,
        totalScore: 0,
        scoreOffset: 0,
        joinedAtRound: 1,
        active: true,
      }));
      let state: GameState = {
        id: makeId(),
        meta: {
          ruleset,
          scoringMethod,
          totalRounds: cardsPerRound.length,
          cardsPerRound,
        },
        phase: "bidding",
        currentRound: 1,
        players,
        rounds: [],
        currentBids: [],
        timeline: [],
        peer: { role: "solo", roomId: null },
      };
      state = appendEvent(state, {
        round: null,
        type: "game_start",
        payload: { playerCount: players.length, ruleset, scoringMethod },
      });
      state = appendEvent(state, {
        round: 1,
        type: "round_start",
        payload: { cards: cardsPerRound[0] },
      });
      return state;
    });
  },

  submitBids(bids: Bid[]) {
    update((s) => ({ ...s, currentBids: bids, phase: "scoring" }));
  },

  saveRound(
    scores: TrickScore[],
    turnExtras: TurnExtra[],
    cardsInPlay: number,
  ) {
    update((s) => {
      const round = {
        number: s.currentRound,
        cardsInPlay,
        bids: s.currentBids,
        scores: scores.map((sc) => ({
          ...sc,
          roundScore: computeRoundScore(
            sc.bid,
            sc.tricksWon,
            sc.bonus,
            cardsInPlay,
            s.currentRound,
            s.meta.scoringMethod,
          ),
          bidRespected: sc.tricksWon === sc.bid,
        })),
        turnExtras,
      };
      const existingIndex = s.rounds.findIndex(
        (r) => r.number === s.currentRound,
      );
      const updatedRounds =
        existingIndex >= 0
          ? s.rounds.map((r, i) => (i === existingIndex ? round : r))
          : [...s.rounds, round];
      let next: GameState = {
        ...s,
        rounds: updatedRounds,
        currentBids: [],
      };
      next = recomputeTotalScores(next);
      const everybodyPassedExtra = turnExtras.find(
        (e) => e.type === "everybody_passed",
      );
      if (everybodyPassedExtra) {
        next = appendEvent(next, {
          round: s.currentRound,
          type: "everybody_passed",
          payload: { count: everybodyPassedExtra.count ?? 1 },
        });
      }

      next = appendEvent(next, {
        round: s.currentRound,
        type: "round_end",
        payload: {
          scores: round.scores.map((sc) => ({
            playerId: sc.playerId,
            roundScore: sc.roundScore,
          })),
        },
      });

      const isLast = s.currentRound >= s.meta.totalRounds;
      if (isLast) {
        next.phase = "gameover";
      } else {
        next.phase = "bidding";
        next.currentRound = s.currentRound + 1;
        next = appendEvent(next, {
          round: next.currentRound,
          type: "round_start",
          payload: { cards: s.meta.cardsPerRound[next.currentRound - 1] },
        });
      }
      return next;
    });
  },

  addPlayer(name: string, preset: ScorePreset | number) {
    update((s) => {
      const initialScore =
        typeof preset === "number"
          ? preset
          : suggestInitialScore(
              preset,
              s.players.filter((p) => p.active),
            );
      const player: Player = {
        id: makeId(),
        name,
        totalScore: initialScore,
        scoreOffset: initialScore,
        joinedAtRound: s.currentRound,
        active: true,
      };
      let next: GameState = { ...s, players: [...s.players, player] };
      next = appendEvent(next, {
        round: s.currentRound,
        type: "player_joined",
        payload: { name, initialScore },
      });
      return next;
    });
  },

  removePlayer(playerId: string) {
    update((s) => {
      const name = s.players.find((p) => p.id === playerId)?.name ?? "";
      let next: GameState = {
        ...s,
        players: s.players.map((p) =>
          p.id === playerId ? { ...p, active: false } : p,
        ),
      };
      next = appendEvent(next, {
        round: s.currentRound,
        type: "player_removed",
        payload: { name },
      });
      return next;
    });
  },

  goBack() {
    update((s) => {
      if (s.phase === "scoring") {
        // Go back to bidding for the same round (bids already in currentBids)
        return { ...s, phase: "bidding" };
      }

      if (s.phase === "bidding" || s.phase === "gameover") {
        // Go back to scoring the previous round
        const prevRound = s.rounds[s.rounds.length - 1];
        if (!prevRound) return s;

        const rounds = s.rounds.slice(0, -1);
        let next: GameState = {
          ...s,
          phase: "scoring",
          currentRound: prevRound.number,
          rounds,
          currentBids: prevRound.bids,
          // Remove the round_end event and any events appended after the previous round_start
          timeline: s.timeline.filter(
            (e) =>
              !(
                e.round === prevRound.number &&
                (e.type === "round_end" || e.type === "everybody_passed")
              ) && !(e.round === s.currentRound && e.type === "round_start"),
          ),
        };
        next = recomputeTotalScores(next);
        return next;
      }

      return s;
    });
  },

  newGame() {
    update(() => defaultState());
  },

  setPeerRole(role: GameState["peer"]["role"], roomId: string | null) {
    update((s) => ({ ...s, peer: { role, roomId } }));
  },

  hydrateFromPeer(state: GameState) {
    _store.set(normalizeTimelineIds(state));
  },
};

export const activePlayers = derived(gameStore, ($s) =>
  $s.players.filter((p) => p.active),
);

export const canGoBack = derived(gameStore, ($s) => {
  if ($s.phase === "scoring") return true;
  if ($s.phase === "bidding" || $s.phase === "gameover")
    return $s.rounds.length > 0;
  return false;
});
