import type { Brainrot } from '@/shared/types';

// Real Kick a Lucky Block brainrots — Simon's data 2026-05-03.
// `base_money_per_sec` is the level-1 income per second.
// `level_growth_factor` = 1.25, calibré depuis un Guerriro Digitale bacon (14.7M lvl1 → 218.1T lvl75).
// All entries share rarity_id=1 since the game does not surface tier categories.
export const brainrots: readonly Brainrot[] = [
  { id: 1,  name: 'Blackhole Goat',           rarity_id: 1, base_money_per_sec: 125_000, level_growth_factor: 1.25 },
  { id: 2,  name: 'Compactorini Diskaloni',   rarity_id: 1, base_money_per_sec: 135_000, level_growth_factor: 1.25 },
  { id: 3,  name: 'Cappucino Clownino',       rarity_id: 1, base_money_per_sec: 135_000, level_growth_factor: 1.25 },
  { id: 4,  name: 'Nuclearo Dinossauro',      rarity_id: 1, base_money_per_sec: 190_000, level_growth_factor: 1.25 },
  { id: 5,  name: 'Chilin Chili',             rarity_id: 1, base_money_per_sec: 220_000, level_growth_factor: 1.25 },
  { id: 6,  name: 'Crazylone Pizzaione',      rarity_id: 1, base_money_per_sec: 225_000, level_growth_factor: 1.25 },
  { id: 7,  name: 'Corn Sahur',               rarity_id: 1, base_money_per_sec: 225_000, level_growth_factor: 1.25 },
  { id: 8,  name: 'Meowl',                    rarity_id: 1, base_money_per_sec: 275_000, level_growth_factor: 1.25 },
  { id: 9,  name: 'Strawberry Elefant',       rarity_id: 1, base_money_per_sec: 420_000, level_growth_factor: 1.25 },
  { id: 10, name: 'Dragonfruitina Dolphinita', rarity_id: 1, base_money_per_sec: 475_000, level_growth_factor: 1.25 },
  { id: 11, name: 'Guerriro Digitale',        rarity_id: 1, base_money_per_sec: 490_000, level_growth_factor: 1.25 },
  { id: 12, name: 'Chicleteira Bicicleteira', rarity_id: 1, base_money_per_sec: 500_000, level_growth_factor: 1.25 },
  { id: 13, name: 'Pot Hotspot',              rarity_id: 1, base_money_per_sec: 525_000, level_growth_factor: 1.25 },
  { id: 14, name: 'Krupuk Pagi Pagi',         rarity_id: 1, base_money_per_sec: 540_000, level_growth_factor: 1.25 },
  { id: 15, name: 'Beluga Beluga',            rarity_id: 1, base_money_per_sec: 575_000, level_growth_factor: 1.25 },
  { id: 16, name: 'Tralaledon',               rarity_id: 1, base_money_per_sec: 625_000, level_growth_factor: 1.25 },
  { id: 17, name: 'Ampali Babel',             rarity_id: 1, base_money_per_sec: 750_000, level_growth_factor: 1.25 },
] as const;

export const brainrotById = (id: number) => brainrots.find((b) => b.id === id);
