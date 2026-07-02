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
  const scoringRounds = state.rounds.filter(
    (round) => round.number <= state.meta.totalRounds,
  );

  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      totalScore:
        p.scoreOffset +
        scoringRounds.reduce((sum, round) => {
          const score = round.scores.find((s) => s.playerId === p.id);
          return sum + (score?.roundScore ?? 0);
        }, 0),
    })),
  };
}

type AppendEvent = Omit<Omit<TimelineEvent, "id">, "timestamp">;

function findRound(state: GameState, roundNumber: number) {
  return state.rounds.find((round) => round.number === roundNumber);
}

function findPreviousRound(state: GameState) {
  const previousRounds = state.rounds.filter(
    (round) =>
      round.number < state.currentRound &&
      round.number <= state.meta.totalRounds,
  );
  if (state.phase === "gameover") {
    return state.rounds
      .filter((round) => round.number <= state.meta.totalRounds)
      .at(-1);
  }
  return previousRounds.at(-1);
}

function findNextRound(state: GameState) {
  return state.rounds.find(
    (round) =>
      round.number > state.currentRound &&
      round.number <= state.meta.totalRounds,
  );
}

function hasRoundStartEvent(state: GameState, roundNumber: number) {
  return state.timeline.some(
    (event) => event.round === roundNumber && event.type === "round_start",
  );
}

function roundsMatch(
  a: GameState["rounds"][number],
  b: GameState["rounds"][number],
) {
  return JSON.stringify(a) === JSON.stringify(b);
}

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
    finishGame = false,
  ) {
    update((s) => {
      const existingIndex = s.rounds.findIndex(
        (r) => r.number === s.currentRound,
      );
      const existingRound = existingIndex >= 0 ? s.rounds[existingIndex] : null;
      const roundBids = s.currentBids.length
        ? s.currentBids
        : (existingRound?.bids ?? []);
      const round = {
        number: s.currentRound,
        cardsInPlay,
        bids: roundBids,
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
      const updatedRounds =
        existingIndex >= 0
          ? s.rounds.map((r, i) => (i === existingIndex ? round : r))
          : [...s.rounds, round];
      let next: GameState = {
        ...s,
        meta: finishGame ? { ...s.meta, totalRounds: s.currentRound } : s.meta,
        rounds: updatedRounds,
        currentBids: [],
      };
      next = recomputeTotalScores(next);
      const isEditingSavedRound = existingRound !== null;

      if (isEditingSavedRound) {
        if (!roundsMatch(existingRound, round)) {
          next = appendEvent(next, {
            round: s.currentRound,
            type: "round_updated",
            payload: {
              before: existingRound,
              after: round,
            },
          });
        }

        if (finishGame) {
          next = appendEvent(next, {
            round: s.currentRound,
            type: "game_ended_early",
            payload: { finalRound: s.currentRound },
          });
          next.phase = "gameover";
          next.currentRound = s.currentRound;
          next = recomputeTotalScores(next);
          return next;
        }

        const nextRoundNumber = s.currentRound + 1;
        if (s.currentRound >= s.meta.totalRounds) {
          next.phase = "gameover";
          next.currentRound = s.currentRound;
          return next;
        }

        const nextSavedRound = findRound(next, nextRoundNumber);
        next.currentRound = nextRoundNumber;
        if (nextSavedRound) {
          next.phase = "scoring";
          next.currentBids = nextSavedRound.bids;
          return next;
        }

        next.phase = "bidding";
        if (!hasRoundStartEvent(next, nextRoundNumber)) {
          next = appendEvent(next, {
            round: nextRoundNumber,
            type: "round_start",
            payload: { cards: s.meta.cardsPerRound[nextRoundNumber - 1] },
          });
        }
        return next;
      }

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

      if (finishGame) {
        next = appendEvent(next, {
          round: s.currentRound,
          type: "game_ended_early",
          payload: { finalRound: s.currentRound },
        });
        next.phase = "gameover";
        next.currentRound = s.currentRound;
        return next;
      }

      const isLast = s.currentRound >= s.meta.totalRounds;
      if (isLast) {
        next.phase = "gameover";
      } else {
        next.phase = "bidding";
        next.currentRound = s.currentRound + 1;
        if (!hasRoundStartEvent(next, next.currentRound)) {
          next = appendEvent(next, {
            round: next.currentRound,
            type: "round_start",
            payload: { cards: s.meta.cardsPerRound[next.currentRound - 1] },
          });
        }
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
        payload: { playerId: player.id, name, initialScore },
      });
      return next;
    });
  },

  updatePlayer(playerId: string, name: string, scoreOffset: number) {
    update((s) => {
      let next: GameState = {
        ...s,
        players: s.players.map((p) =>
          p.id === playerId ? { ...p, name, scoreOffset } : p,
        ),
      };
      // Patch the player_joined timeline event payload too.
      // Match by playerId if present (new events), or by name for older saved events.
      const originalName = s.players.find((p) => p.id === playerId)?.name;
      next = {
        ...next,
        timeline: next.timeline.map((ev) => {
          if (ev.type !== "player_joined") return ev;
          const p = ev.payload as { playerId?: string; name?: string };
          const matches = p.playerId === playerId || (!p.playerId && p.name === originalName);
          return matches
            ? { ...ev, payload: { ...ev.payload, playerId, name, initialScore: scoreOffset } }
            : ev;
        }),
      };
      next = recomputeTotalScores(next);
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
        const savedRound = findRound(s, s.currentRound);
        return {
          ...s,
          phase: "bidding",
          currentBids: s.currentBids.length
            ? s.currentBids
            : (savedRound?.bids ?? []),
        };
      }

      if (s.phase === "bidding" || s.phase === "gameover") {
        const prevRound = findPreviousRound(s);
        if (!prevRound) return s;

        let next: GameState = {
          ...s,
          phase: "scoring",
          currentRound: prevRound.number,
          currentBids: prevRound.bids,
        };
        next = recomputeTotalScores(next);
        return next;
      }

      return s;
    });
  },

  goForward() {
    update((s) => {
      if (s.phase === "bidding") {
        const savedRound = findRound(s, s.currentRound);
        if (!savedRound && s.currentBids.length === 0) return s;

        return {
          ...s,
          phase: "scoring",
          currentBids: savedRound?.bids ?? s.currentBids,
        };
      }

      if (s.phase === "scoring") {
        const nextSavedRound = findNextRound(s);
        if (nextSavedRound) {
          return {
            ...s,
            phase: "scoring",
            currentRound: nextSavedRound.number,
            currentBids: nextSavedRound.bids,
          };
        }

        if (!findRound(s, s.currentRound)) return s;

        if (s.currentRound >= s.meta.totalRounds) {
          return { ...s, phase: "gameover", currentBids: [] };
        }

        const nextRoundNumber = s.currentRound + 1;
        const nextRound = findRound(s, nextRoundNumber);
        return {
          ...s,
          phase: nextRound ? "scoring" : "bidding",
          currentRound: nextRoundNumber,
          currentBids: nextRound?.bids ?? [],
        };
      }

      return s;
    });
  },

  goToRound(roundNumber: number) {
    update((s) => {
      if (s.phase === "setup") return s;

      if (roundNumber < 1 || roundNumber > s.meta.totalRounds) return s;

      const savedRound = findRound(s, roundNumber);
      if (savedRound) {
        return {
          ...s,
          phase: "scoring",
          currentRound: savedRound.number,
          currentBids: savedRound.bids,
        };
      }

      return {
        ...s,
        phase: "bidding",
        currentRound: roundNumber,
        currentBids: [],
      };
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
  if ($s.phase === "bidding" || $s.phase === "gameover") {
    return findPreviousRound($s) !== undefined;
  }
  return false;
});

export const canGoForward = derived(gameStore, ($s) => {
  if ($s.phase === "bidding") {
    return (
      findRound($s, $s.currentRound) !== undefined || $s.currentBids.length > 0
    );
  }

  if ($s.phase === "scoring") {
    return (
      findNextRound($s) !== undefined ||
      findRound($s, $s.currentRound) !== undefined
    );
  }

  return false;
});
