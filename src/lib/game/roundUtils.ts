export function computeCardsPerRound(
  playerCount: number,
  deckSize: number,
): number[] {
  const maxCards = Math.min(10, Math.floor(deckSize / playerCount));
  return Array.from({ length: maxCards }, (_, i) => i + 1);
}

export function isLargeGroup(playerCount: number, deckSize: number): boolean {
  return Math.floor(deckSize / playerCount) < 10;
}

export function largeGroupWarning(
  playerCount: number,
  deckSize: number,
): string | null {
  if (!isLargeGroup(playerCount, deckSize)) return null;
  const maxCards = Math.floor(deckSize / playerCount);
  return `With ${playerCount} players, you'll play ${maxCards} rounds with up to ${maxCards} cards instead of 10.`;
}
