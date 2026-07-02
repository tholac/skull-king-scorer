import type { Player } from './types';

export type ScorePreset = 'zero' | 'average' | 'median';

export function suggestInitialScore(
  preset: ScorePreset,
  activePlayers: Player[],
): number {
  if (preset === 'zero' || activePlayers.length === 0) return 0;

  const scores = activePlayers.map((p) => p.totalScore).sort((a, b) => a - b);

  if (preset === 'average') {
    return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  }

  const mid = Math.floor(scores.length / 2);
  return scores.length % 2 === 1
    ? scores[mid]
    : scores[mid - 1];
}
