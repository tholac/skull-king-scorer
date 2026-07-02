import type { Ruleset } from "../types";

export const baseRuleset: Ruleset = {
  id: "base",
  label: "Base Game",
  deckSize: 66,
  maxPlayers: 6,
  extras: [],
  bonuses: [
    { label: "Skull King captures a pirate", points: "+20 per pirate" },
    { label: "Mermaid escapes Skull King", points: "+20" },
    { label: "Standard 14 (black) captured", points: "+10" },
    { label: "Loot card captured", points: "per card value" },
  ],
};
