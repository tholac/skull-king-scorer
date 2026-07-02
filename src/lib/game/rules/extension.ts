import type { Ruleset } from "../types";

export const extendedRuleset: Ruleset = {
  id: "extended",
  label: "Base + Extension",
  deckSize: 80,
  maxPlayers: 8,
  extras: [{ type: "kraken", label: "Kraken released", icon: "🦑" }],
  bonuses: [
    { label: "Skull King captures a pirate", points: "+20 per pirate" },
    { label: "Mermaid seduces Skull King", points: "+20" },
    { label: "Standard 14 (black) captured", points: "+10" },
    { label: "Loot card captured", points: "per card value" },
    { label: "Davy Jones bonus", points: "+20" },
    { label: "Stingray/Kraken captured", points: "+20" },
  ],
};
