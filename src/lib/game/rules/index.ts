import type { Ruleset, RulesetId } from "../types";
import { baseRuleset } from "./base";
import { extendedRuleset } from "./extension";
import * as m from "$lib/paraglide/messages.js";

const registry: Record<RulesetId, Ruleset> = {
  base: baseRuleset,
  extended: extendedRuleset,
};

const rulesetLabel: Record<RulesetId, () => string> = {
  base: () => m.ruleset_base(),
  extended: () => m.ruleset_extended(),
};

const bonusTranslations: Record<string, { label: () => string; points: () => string }> = {
  "Skull King captures a pirate": { label: () => m.bonus_skull_king_captures_pirate(), points: () => m.bonus_skull_king_pts() },
  "Mermaid escapes Skull King": { label: () => m.bonus_mermaid_escapes(), points: () => m.bonus_mermaid_pts() },
  "Mermaid seduces Skull King": { label: () => m.bonus_mermaid_seduces(), points: () => m.bonus_mermaid_pts() },
  "Standard 14 (black) captured": { label: () => m.bonus_black14(), points: () => m.bonus_black14_pts() },
  "Loot card captured": { label: () => m.bonus_loot(), points: () => m.bonus_loot_pts() },
  "Davy Jones bonus": { label: () => m.bonus_davy_jones(), points: () => m.bonus_davy_jones_pts() },
  "Stingray/Kraken captured": { label: () => m.bonus_stingray(), points: () => m.bonus_stingray_pts() },
};

const extraTranslations: Record<string, () => string> = {
  kraken: () => m.kraken_label(),
};

export function getRuleset(id: RulesetId): Ruleset {
  const raw = registry[id];
  return {
    ...raw,
    label: rulesetLabel[id]?.() ?? raw.label,
    bonuses: raw.bonuses.map((b) => {
      const t = bonusTranslations[b.label];
      return t ? { label: t.label(), points: t.points() } : b;
    }),
    extras: raw.extras.map((e) => {
      const t = extraTranslations[e.type];
      return t ? { ...e, label: t() } : e;
    }),
  };
}
