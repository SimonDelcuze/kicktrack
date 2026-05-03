import { describe, it, expect } from 'vitest';
import {
  getMoneyPerSecAtLevel,
  currentMoneyPerSec,
  totalIncome,
  maxPotential,
} from '@/shared/utils/calculations';
import type { Brainrot, UserBrainrot } from '@/shared/types';

const sampleBrainrot: Brainrot = {
  id: 1,
  name: 'Test',
  rarity_id: 1,
  base_money_per_sec: 10,
  level_growth_factor: 1.1,
};

describe('getMoneyPerSecAtLevel', () => {
  it('returns base value at level 1', () => {
    expect(getMoneyPerSecAtLevel(sampleBrainrot, 1)).toBeCloseTo(10);
  });

  it('applies geometric growth', () => {
    expect(getMoneyPerSecAtLevel(sampleBrainrot, 2)).toBeCloseTo(11);
    expect(getMoneyPerSecAtLevel(sampleBrainrot, 3)).toBeCloseTo(12.1);
  });

  it('throws on out-of-range level', () => {
    expect(() => getMoneyPerSecAtLevel(sampleBrainrot, 0)).toThrow();
    expect(() => getMoneyPerSecAtLevel(sampleBrainrot, 76)).toThrow();
  });
});

const sampleMutation = {
  id: 1,
  name: 'gold',
  multiplier: 2,
  color_hex: '#000',
  tier_order: 1,
};

describe('currentMoneyPerSec', () => {
  it('equals getMoneyPerSecAtLevel when no mutation', () => {
    expect(currentMoneyPerSec(sampleBrainrot, 5, null)).toBeCloseTo(
      getMoneyPerSecAtLevel(sampleBrainrot, 5),
    );
  });

  it('multiplies by mutation when present', () => {
    const base = getMoneyPerSecAtLevel(sampleBrainrot, 5);
    expect(currentMoneyPerSec(sampleBrainrot, 5, sampleMutation)).toBeCloseTo(base * 2);
  });
});

describe('totalIncome', () => {
  const catalog = {
    brainrots: [sampleBrainrot],
    mutations: [sampleMutation],
  };

  it('returns 0 for empty base', () => {
    expect(totalIncome([], catalog)).toBe(0);
  });

  it('sums income across the base', () => {
    const base: UserBrainrot[] = [
      { id: 'a', brainrot_id: 1, mutation_id: null,  level: 1, created_at: '', updated_at: '' },
      { id: 'b', brainrot_id: 1, mutation_id: 1,     level: 1, created_at: '', updated_at: '' },
    ];
    expect(totalIncome(base, catalog)).toBeCloseTo(10 + 20);
  });

  it('skips entries whose brainrot is not in the catalog', () => {
    const base: UserBrainrot[] = [
      { id: 'a', brainrot_id: 999, mutation_id: null, level: 1, created_at: '', updated_at: '' },
    ];
    expect(totalIncome(base, catalog)).toBe(0);
  });
});

describe('maxPotential', () => {
  it('uses MAX_LEVEL and best mutation', () => {
    const expected = sampleBrainrot.base_money_per_sec
      * Math.pow(sampleBrainrot.level_growth_factor, 74)
      * sampleMutation.multiplier;
    expect(maxPotential(sampleBrainrot, sampleMutation)).toBeCloseTo(expected);
  });
});
