import type { Brainrot } from '@/shared/types';

// Real Kick a Lucky Block brainrots — Simon's data 2026-05-03.
// `base_money_per_sec` is the level-1 income per second.
// `level_growth_factor` is a placeholder (geometric +5%/level) until the real curve is confirmed.
// All entries share rarity_id=1 since the game does not surface tier categories.
export const brainrots: readonly Brainrot[] = [
  { id: 1,  name: 'Blackhole Goat',           rarity_id: 1, base_money_per_sec: 125_000, level_growth_factor: 1.05 },
  { id: 2,  name: 'Compactorini Diskaloni',   rarity_id: 1, base_money_per_sec: 135_000, level_growth_factor: 1.05 },
  { id: 3,  name: 'Cappucino Clownino',       rarity_id: 1, base_money_per_sec: 135_000, level_growth_factor: 1.05 },
  { id: 4,  name: 'Nuclearo Dinossauro',      rarity_id: 1, base_money_per_sec: 190_000, level_growth_factor: 1.05 },
  { id: 5,  name: 'Chilin Chili',             rarity_id: 1, base_money_per_sec: 220_000, level_growth_factor: 1.05 },
  { id: 6,  name: 'Crazylone Pizzaione',      rarity_id: 1, base_money_per_sec: 225_000, level_growth_factor: 1.05 },
  { id: 7,  name: 'Corn Sahur',               rarity_id: 1, base_money_per_sec: 225_000, level_growth_factor: 1.05 },
  { id: 8,  name: 'Meowl',                    rarity_id: 1, base_money_per_sec: 275_000, level_growth_factor: 1.05 },
  { id: 9,  name: 'Strawberry Elefant',       rarity_id: 1, base_money_per_sec: 420_000, level_growth_factor: 1.05 },
  { id: 10, name: 'Dragonfruitina Dolphinita', rarity_id: 1, base_money_per_sec: 475_000, level_growth_factor: 1.05 },
  { id: 11, name: 'Guerriro Digitale',        rarity_id: 1, base_money_per_sec: 490_000, level_growth_factor: 1.05 },
  { id: 12, name: 'Chicleteira Bicicleteira', rarity_id: 1, base_money_per_sec: 500_000, level_growth_factor: 1.05 },
  { id: 13, name: 'Pot Hotspot',              rarity_id: 1, base_money_per_sec: 525_000, level_growth_factor: 1.05 },
  { id: 14, name: 'Krupuk Pagi Pagi',         rarity_id: 1, base_money_per_sec: 540_000, level_growth_factor: 1.05 },
] as const;

export const brainrotById = (id: number) => brainrots.find((b) => b.id === id);
