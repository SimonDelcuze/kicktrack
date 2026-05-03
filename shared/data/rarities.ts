import type { Rarity } from '@/shared/types';

// Kick a Lucky Block does not surface rarity tiers the way many pet sims do —
// brainrots are differentiated by their base income and visual identity instead.
// We keep a single neutral tier so the schema/types stay valid.
export const rarities: readonly Rarity[] = [
  { id: 1, name: 'Brainrot', tier_order: 1, color_hex: '#c9a961' },
] as const;

export const rarityById = (id: number) => rarities.find((r) => r.id === id);
