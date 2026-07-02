import type { Ruleset, RulesetId } from '../types';
import { baseRuleset } from './base';
import { extendedRuleset } from './extension';

const registry: Record<RulesetId, Ruleset> = {
  base: baseRuleset,
  extended: extendedRuleset,
};

export function getRuleset(id: RulesetId): Ruleset {
  return registry[id];
}
