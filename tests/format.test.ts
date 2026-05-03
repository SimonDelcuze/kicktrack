import { describe, it, expect } from 'vitest';
import { formatNumber } from '@/shared/utils/format';

describe('formatNumber', () => {
  it('returns plain digits below 1000', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(42)).toBe('42');
    expect(formatNumber(999)).toBe('999');
  });

  it('uses k for thousands', () => {
    expect(formatNumber(1_000)).toBe('1.0k');
    expect(formatNumber(12_500)).toBe('12.5k');
  });

  it('uses M for millions', () => {
    expect(formatNumber(2_500_000)).toBe('2.5M');
  });

  it('uses B for billions', () => {
    expect(formatNumber(7_300_000_000)).toBe('7.3B');
  });
});
