import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRedis } = vi.hoisted(() => ({
  mockRedis: { get: vi.fn(), set: vi.fn(), del: vi.fn() },
}));
vi.mock('server-only', () => ({}));
vi.mock('@/server/lib/kv', () => ({
  redis: mockRedis,
  SIMON_SLUG: 'simontest',
  baseKey: (slug: string) => `kicktrack:${slug}:base`,
  tradeKey: (slug: string) => `kicktrack:${slug}:trade`,
  tradeLogKey: (slug: string) => `kicktrack:${slug}:trade:log`,
  LEGACY_BASE_KEY: 'kicktrack:base',
  LEGACY_TRADE_KEY: 'kicktrack:trade',
  LEGACY_TRADE_LOG_KEY: 'kicktrack:trade:log',
}));

import { removeOneByComboFromBase } from '@/server/services/base';

const TEST_SLUG = 'test';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('removeOneByComboFromBase', () => {
  it('pops the most-recent matching entry', async () => {
    const older = {
      id: '11111111-1111-1111-1111-111111111111',
      brainrot_id: 1,
      mutation_id: 7,
      level: 1,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    const newer = { ...older, id: '22222222-2222-2222-2222-222222222222', created_at: '2026-02-01T00:00:00.000Z' };
    mockRedis.get.mockResolvedValueOnce([older, newer]);
    mockRedis.set.mockResolvedValueOnce('OK');

    const result = await removeOneByComboFromBase(TEST_SLUG, 1, 7, 1);

    expect(result?.removedId).toBe(newer.id);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:test:base', [older]);
  });

  it('returns null when nothing matches', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    expect(await removeOneByComboFromBase(TEST_SLUG, 1, null, 1)).toBeNull();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('matches null mutation correctly', async () => {
    const entry = {
      id: '33333333-3333-3333-3333-333333333333',
      brainrot_id: 3,
      mutation_id: null,
      level: 1,
      created_at: 'x',
      updated_at: 'x',
    };
    mockRedis.get.mockResolvedValueOnce([entry]);
    mockRedis.set.mockResolvedValueOnce('OK');
    expect((await removeOneByComboFromBase(TEST_SLUG, 3, null, 1))?.removedId).toBe(entry.id);
  });

  it('respects the level filter', async () => {
    const lvl1 = {
      id: '44444444-4444-4444-4444-444444444444',
      brainrot_id: 1,
      mutation_id: null,
      level: 1,
      created_at: 'a',
      updated_at: 'a',
    };
    const lvl5 = { ...lvl1, id: '55555555-5555-5555-5555-555555555555', level: 5 };
    mockRedis.get.mockResolvedValueOnce([lvl1, lvl5]);
    mockRedis.set.mockResolvedValueOnce('OK');
    const result = await removeOneByComboFromBase(TEST_SLUG, 1, null, 5);
    expect(result?.removedId).toBe(lvl5.id);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:test:base', [lvl1]);
  });
});
