import type { ScoringMethod } from "./types";

export function computeRoundScore(
  bid: number,
  tricksWon: number,
  bonus: number,
  cardsInPlay: number,
  round: number,
  method: ScoringMethod,
): number {
  let base: number;

  if (bid === 0) {
    base = tricksWon === 0 ? 10 * cardsInPlay : -10 * cardsInPlay;
  } else if (method === "classic") {
    base = tricksWon === bid ? 20 * bid : -10 * Math.abs(bid - tricksWon);
  } else {
    const pool = 10 * round;
    const diff = Math.abs(bid - tricksWon);
    if (diff === 0) base = pool;
    else if (diff === 1) base = Math.floor(pool / 2);
    else base = 0;
  }

  return base + bonus;
}
