import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';

export const MAX_LEVEL = 75;

export function maxLevelIncome(brainrot: Brainrot): number {
  return getMoneyPerSecAtLevel(brainrot, MAX_LEVEL);
}

export function getMoneyPerSecAtLevel(brainrot: Brainrot, level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) {
    throw new Error(`level must be an integer between 1 and ${MAX_LEVEL}, got ${level}`);
  }
  return brainrot.base_money_per_sec * Math.pow(brainrot.level_growth_factor, level - 1);
}

export function currentMoneyPerSec(
  brainrot: Brainrot,
  level: number,
  mutation: Mutation | null,
): number {
  const base = getMoneyPerSecAtLevel(brainrot, level);
  return mutation ? base * mutation.multiplier : base;
}

export function totalIncome(
  base: UserBrainrot[],
  catalog: { brainrots: readonly Brainrot[]; mutations: readonly Mutation[] },
): number {
  return base.reduce((sum, ub) => {
    const brainrot = catalog.brainrots.find((b) => b.id === ub.brainrot_id);
    if (!brainrot) return sum;
    const mutation =
      ub.mutation_id != null
        ? catalog.mutations.find((m) => m.id === ub.mutation_id) ?? null
        : null;
    return sum + currentMoneyPerSec(brainrot, ub.level, mutation);
  }, 0);
}

export function maxPotential(
  brainrot: Brainrot,
  bestMutation: Mutation,
): number {
  return currentMoneyPerSec(brainrot, MAX_LEVEL, bestMutation);
}

/**
 * Tie-breaker for two mutations: returns a value usable in Array.sort.
 * Lower tier_order wins (e.g. rainbow tier=13 precedes bacon tier=14 when both
 * are ×30). A null mutation sorts last. Use chained after a primary income
 * comparator: `(b.income - a.income) || compareMutationTier(a.mutation, b.mutation)`.
 */
export function compareMutationTier(
  a: Mutation | null,
  b: Mutation | null,
): number {
  return (
    (a?.tier_order ?? Number.MAX_SAFE_INTEGER) -
    (b?.tier_order ?? Number.MAX_SAFE_INTEGER)
  );
}
