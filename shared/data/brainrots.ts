import type { Brainrot } from '@/shared/types';

// PLACEHOLDER catalogue. Simon to populate with real game data.
// Add entries as: { id, name, rarity_id, base_money_per_sec, level_growth_factor }.
export const brainrots: readonly Brainrot[] = [
  { id: 1, name: 'Sample Common Brainrot',   rarity_id: 1, base_money_per_sec: 1,   level_growth_factor: 1.05 },
  { id: 2, name: 'Sample Rare Brainrot',     rarity_id: 2, base_money_per_sec: 5,   level_growth_factor: 1.05 },
  { id: 3, name: 'Sample Epic Brainrot',     rarity_id: 3, base_money_per_sec: 25,  level_growth_factor: 1.05 },
  { id: 4, name: 'Sample Legendary',         rarity_id: 4, base_money_per_sec: 100, level_growth_factor: 1.05 },
] as const;

export const brainrotById = (id: number) => brainrots.find((b) => b.id === id);
