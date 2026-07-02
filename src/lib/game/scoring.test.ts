import { describe, it, expect } from "vitest";
import { computeRoundScore } from "./scoring";

describe("classic scoring", () => {
  it("bid=0 respected: +10 * cardsInPlay", () => {
    expect(computeRoundScore(0, 0, 0, 7, 7, "classic")).toBe(70);
  });
  it("bid=0 missed: -10 * cardsInPlay", () => {
    expect(computeRoundScore(0, 1, 0, 7, 7, "classic")).toBe(-70);
  });
  it("bid>0 respected: +20 * bid", () => {
    expect(computeRoundScore(3, 3, 0, 7, 7, "classic")).toBe(60);
  });
  it("bid>0 missed: -10 * |bid - tricksWon|", () => {
    expect(computeRoundScore(3, 1, 0, 7, 7, "classic")).toBe(-20);
  });
  it("bonus always added on top", () => {
    expect(computeRoundScore(3, 3, 20, 7, 7, "classic")).toBe(80);
  });
  it("bid>0 missed + bonus", () => {
    expect(computeRoundScore(3, 1, 10, 7, 7, "classic")).toBe(-10);
  });
});

describe("rascal scoring", () => {
  it("exact bid: full pool (10 * round)", () => {
    expect(computeRoundScore(3, 3, 0, 7, 5, "rascal")).toBe(50);
  });
  it("1 trick off: floor(pool / 2)", () => {
    expect(computeRoundScore(3, 2, 0, 7, 5, "rascal")).toBe(25);
  });
  it("2+ tricks off: 0", () => {
    expect(computeRoundScore(3, 0, 0, 7, 5, "rascal")).toBe(0);
  });
  it("bid=0 respected: +10 * cardsInPlay", () => {
    expect(computeRoundScore(0, 0, 0, 7, 5, "rascal")).toBe(70);
  });
  it("bid=0 missed: -10 * cardsInPlay", () => {
    expect(computeRoundScore(0, 2, 0, 7, 5, "rascal")).toBe(-70);
  });
  it("bonus always added on top", () => {
    expect(computeRoundScore(3, 3, 20, 7, 5, "rascal")).toBe(70);
  });
  it("odd pool rounds down on 1 off", () => {
    expect(computeRoundScore(2, 1, 0, 4, 3, "rascal")).toBe(15); // pool=30, half=15
  });
  it("rascal 2+ off: bonus still added on top of 0 base", () => {
    expect(computeRoundScore(3, 0, 20, 7, 5, "rascal")).toBe(20);
  });
});
