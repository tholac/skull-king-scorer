import { describe, it, expect } from "vitest";
import { suggestInitialScore } from "./playerUtils";
import type { Player } from "./types";

const players = (scores: number[]): Player[] =>
  scores.map((s, i) => ({
    id: `p${i}`,
    name: `P${i}`,
    totalScore: s,
    scoreOffset: 0,
    joinedAtRound: 1,
    active: true,
  }));

describe("suggestInitialScore", () => {
  it("zero always returns 0", () => {
    expect(suggestInitialScore("zero", players([100, 200, 300]))).toBe(0);
  });

  it("average: mean of active player scores", () => {
    expect(suggestInitialScore("average", players([100, 200, 300]))).toBe(200);
  });

  it("median: middle value (odd count)", () => {
    expect(suggestInitialScore("median", players([100, 300, 200]))).toBe(200);
  });

  it("median: lower-middle (even count)", () => {
    expect(suggestInitialScore("median", players([100, 200, 300, 400]))).toBe(
      200,
    );
  });

  it("average with no players returns 0", () => {
    expect(suggestInitialScore("average", [])).toBe(0);
  });

  it("median with no players returns 0", () => {
    expect(suggestInitialScore("median", [])).toBe(0);
  });
});
