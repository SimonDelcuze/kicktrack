import type { Mutation } from '@/shared/types';

// PLACEHOLDER multipliers — Simon to provide real values.
export const mutations: readonly Mutation[] = [
  { id: 1, name: 'gold',         multiplier: 2,    color_hex: '#facc15', tier_order: 1 },
  { id: 2, name: 'diamond',      multiplier: 3,    color_hex: '#22d3ee', tier_order: 2 },
  { id: 3, name: 'plasma',       multiplier: 4,    color_hex: '#ec4899', tier_order: 3 },
  { id: 4, name: 'molten',       multiplier: 5,    color_hex: '#f97316', tier_order: 4 },
  { id: 5, name: 'radioactive',  multiplier: 6,    color_hex: '#84cc16', tier_order: 5 },
  { id: 6, name: 'shadow',       multiplier: 7,    color_hex: '#1f2937', tier_order: 6 },
  { id: 7, name: 'electrified',  multiplier: 8,    color_hex: '#fde047', tier_order: 7 },
  { id: 8, name: 'rainbow',      multiplier: 10,   color_hex: '#a78bfa', tier_order: 8 },
  { id: 9, name: 'void',         multiplier: 15,   color_hex: '#6b21a8', tier_order: 9 },
] as const;

export const mutationById = (id: number) => mutations.find((m) => m.id === id);
export const bestMutation = mutations.reduce(
  (best, m) => (m.multiplier > best.multiplier ? m : best),
  mutations[0],
);
