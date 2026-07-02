import { describe, it, expect } from "vitest";
import { computeCardsPerRound } from "./roundUtils";

describe("computeCardsPerRound", () => {
  it("standard 2-6 players: 10 rounds, cards 1..10", () => {
    const result = computeCardsPerRound(4, 66);
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("7 players base: floor(66/7)=9 rounds, cards 1..9", () => {
    const result = computeCardsPerRound(7, 66);
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("8 players base: floor(66/8)=8 rounds, cards 1..8", () => {
    const result = computeCardsPerRound(8, 66);
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("8 players extended: floor(80/8)=10 rounds, cards 1..10", () => {
    const result = computeCardsPerRound(8, 80);
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("never exceeds 10 rounds", () => {
    const result = computeCardsPerRound(2, 66);
    expect(result.length).toBe(10);
  });
});
