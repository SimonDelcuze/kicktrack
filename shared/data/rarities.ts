import type { Rarity } from '@/shared/types';

// PLACEHOLDER — real game rarities to be confirmed by Simon.
export const rarities: readonly Rarity[] = [
  { id: 1, name: 'Common',    tier_order: 1, color_hex: '#9ca3af' },
  { id: 2, name: 'Rare',      tier_order: 2, color_hex: '#3b82f6' },
  { id: 3, name: 'Epic',      tier_order: 3, color_hex: '#a855f7' },
  { id: 4, name: 'Legendary', tier_order: 4, color_hex: '#f59e0b' },
  { id: 5, name: 'Mythic',    tier_order: 5, color_hex: '#ef4444' },
] as const;

export const rarityById = (id: number) => rarities.find((r) => r.id === id);
