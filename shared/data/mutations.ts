import type { Mutation } from '@/shared/types';

// Real Kick a Lucky Block mutations — Simon's data 2026-05-03 (extended 2026-05-04).
// Order is by ascending multiplier (= weakest → strongest). Stable IDs across reorderings.
export const mutations: readonly Mutation[] = [
  { id: 1,  name: 'gold',         multiplier: 1.5, color_hex: '#facc15', tier_order: 1  }, // jaune
  { id: 2,  name: 'diamond',      multiplier: 2,   color_hex: '#3b82f6', tier_order: 2  }, // bleu
  { id: 3,  name: 'plasma',       multiplier: 4,   color_hex: '#ec4899', tier_order: 3  }, // rose
  { id: 4,  name: 'molten',       multiplier: 6,   color_hex: '#f97316', tier_order: 4  }, // orange
  { id: 5,  name: 'radioactive',  multiplier: 8,   color_hex: '#86efac', tier_order: 5  }, // vert clair
  { id: 6,  name: 'void',         multiplier: 10,  color_hex: '#581c87', tier_order: 6  }, // violet foncé
  { id: 7,  name: 'virus',        multiplier: 10,  color_hex: '#15803d', tier_order: 7  }, // vert foncé
  { id: 8,  name: 'shadow',       multiplier: 12,  color_hex: '#0a0a0a', tier_order: 8  }, // noir
  { id: 14, name: 'enchanted',    multiplier: 12,  color_hex: '#fbcfe8', tier_order: 9  }, // rose pale
  { id: 9,  name: 'electrified',  multiplier: 16,  color_hex: '#7dd3fc', tier_order: 10 }, // bleu clair
  { id: 11, name: 'wet',          multiplier: 16,  color_hex: '#1d4ed8', tier_order: 11 }, // bleu foncé
  { id: 12, name: 'alien',        multiplier: 22,  color_hex: '#d946ef', tier_order: 12 }, // rose / fuchsia
  { id: 10, name: 'rainbow',      multiplier: 30,  color_hex: '#ec4899', tier_order: 13 }, // arc-en-ciel — UI applies a gradient.
  { id: 13, name: 'bacon',        multiplier: 30,  color_hex: '#f59e0b', tier_order: 14 }, // orange ambré
  { id: 15, name: 'astral',       multiplier: 35,  color_hex: '#7c3aed', tier_order: 15 }, // violet
  { id: 16, name: 'phantom',      multiplier: 35,  color_hex: '#bbf7d0', tier_order: 16 }, // vert très clair
] as const;

export const mutationById = (id: number) => mutations.find((m) => m.id === id);

export const bestMutation = mutations.reduce(
  (best, m) => (m.multiplier > best.multiplier ? m : best),
  mutations[0],
);

// Special-case lookup: the rainbow mutation gets a CSS gradient instead of a flat color.
export const RAINBOW_MUTATION_ID = 10;
