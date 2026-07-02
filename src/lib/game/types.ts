export type Phase = 'setup' | 'bidding' | 'scoring' | 'gameover';
export type RulesetId = 'base' | 'extended';
export type ScoringMethod = 'classic' | 'rascal';

export interface GameState {
  id: string;
  meta: {
    ruleset: RulesetId;
    scoringMethod: ScoringMethod;
    totalRounds: number;
    cardsPerRound: number[];
  };
  phase: Phase;
  currentRound: number;
  players: Player[];
  rounds: Round[];
  currentBids: Bid[];
  timeline: TimelineEvent[];
  peer: {
    role: 'solo' | 'host' | 'guest';
    roomId: string | null;
  };
}

export interface Player {
  id: string;
  name: string;
  totalScore: number;   // scoreOffset + sum of roundScores — recomputed on every save
  scoreOffset: number;  // initial score for mid-game joins; 0 for players starting at game start
  joinedAtRound: number;
  active: boolean;
}

export interface Round {
  number: number;
  cardsInPlay: number;
  bids: Bid[];
  scores: TrickScore[];
  turnExtras: TurnExtra[];
}

export interface Bid {
  playerId: string;
  bid: number;
}

export interface TrickScore {
  playerId: string;
  bid: number;
  tricksWon: number;
  bidRespected: boolean;
  bonus: number;
  roundScore: number;
}

export interface TurnExtra {
  type: 'kraken' | 'whale' | string;
  note?: string;
}

export interface TurnExtraDefinition {
  type: string;
  label: string;
  icon: string;
}

export interface BonusDefinition {
  label: string;
  points: string;
}

export interface Ruleset {
  id: RulesetId;
  label: string;
  deckSize: number;
  maxPlayers: number;
  extras: TurnExtraDefinition[];
  bonuses: BonusDefinition[];
}

export interface TimelineEvent {
  id: number;
  round: number | null;
  type:
    | 'game_start'
    | 'round_start'
    | 'round_end'
    | 'player_joined'
    | 'player_removed'
    | 'turn_extra'
    | string;
  payload: Record<string, unknown>;
  timestamp: number;
}
