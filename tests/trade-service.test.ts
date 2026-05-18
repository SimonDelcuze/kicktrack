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

import {
  getTrade,
  addToTrade,
  removeOneByComboFromTrade,
  replaceTrade,
} from '@/server/services/trade';

const TEST_SLUG = 'test';
const SIMON_SLUG = 'simontest';

beforeEach(() => {
  vi.clearAllMocks();
});

function makeEntry(overrides: Partial<{ id: string; brainrot_id: number; mutation_id: number | null }>) {
  return {
    id: overrides.id ?? '550e8400-e29b-41d4-a716-446655440000',
    brainrot_id: overrides.brainrot_id ?? 1,
    mutation_id: overrides.mutation_id ?? null,
    level: 1,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('getTrade', () => {
  it('returns [] when empty', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    expect(await getTrade(TEST_SLUG)).toEqual([]);
  });

  it('migration: when slug===SIMON_SLUG and slug-key is empty but legacy exists, migrates data', async () => {
    const legacy = [makeEntry({})];
    mockRedis.get.mockResolvedValueOnce(null).mockResolvedValueOnce(legacy);
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.del.mockResolvedValueOnce(1);

    const result = await getTrade(SIMON_SLUG);
    expect(result).toEqual(legacy);
    expect(mockRedis.set).toHaveBeenCalledWith(`kicktrack:${SIMON_SLUG}:trade`, legacy);
    expect(mockRedis.del).toHaveBeenCalledWith('kicktrack:trade');
  });

  it('migration: when slug!==SIMON_SLUG and slug-key is empty, returns [] without checking legacy', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    const result = await getTrade('otherslug');
    expect(result).toEqual([]);
    expect(mockRedis.get).toHaveBeenCalledTimes(1);
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('migration: when slug-keyed data exists, returns it without reading legacy', async () => {
    const existing = [makeEntry({})];
    mockRedis.get.mockResolvedValueOnce(existing);
    const result = await getTrade(SIMON_SLUG);
    expect(result).toEqual(existing);
    expect(mockRedis.get).toHaveBeenCalledTimes(1);
  });
});

describe('addToTrade', () => {
  it('appends a new entry with generated id, level=1, and returns the corresponding event', async () => {
    // First call = getTrade, second call = getTradeLog
    mockRedis.get.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockRedis.set.mockResolvedValue('OK');

    const result = await addToTrade(TEST_SLUG, 1, 7);

    expect(result.entry.brainrot_id).toBe(1);
    expect(result.entry.mutation_id).toBe(7);
    expect(result.entry.level).toBe(1);
    expect(result.entry.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.event.op).toBe('+');
    expect(result.event.brainrot_id).toBe(1);
    expect(result.event.mutation_id).toBe(7);

    // Two writes: trade then log
    expect(mockRedis.set).toHaveBeenCalledTimes(2);
    expect(mockRedis.set).toHaveBeenNthCalledWith(1, 'kicktrack:test:trade', [result.entry]);
    expect(mockRedis.set).toHaveBeenNthCalledWith(2, 'kicktrack:test:trade:log', [result.event]);
  });

  it('accepts a null mutation', async () => {
    mockRedis.get.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockRedis.set.mockResolvedValue('OK');
    const result = await addToTrade(TEST_SLUG, 2, null);
    expect(result.entry.mutation_id).toBeNull();
    expect(result.event.mutation_id).toBeNull();
  });
});

describe('removeOneByComboFromTrade', () => {
  it('pops the most-recent matching entry and appends a - event', async () => {
    const older = { ...makeEntry({ id: '11111111-1111-1111-1111-111111111111', brainrot_id: 1, mutation_id: 7 }), created_at: '2026-01-01T00:00:00.000Z' };
    const newer = { ...makeEntry({ id: '22222222-2222-2222-2222-222222222222', brainrot_id: 1, mutation_id: 7 }), created_at: '2026-01-02T00:00:00.000Z' };
    mockRedis.get.mockResolvedValueOnce([older, newer]).mockResolvedValueOnce([]);
    mockRedis.set.mockResolvedValue('OK');

    const result = await removeOneByComboFromTrade(TEST_SLUG, 1, 7);

    expect(result).not.toBeNull();
    expect(result!.removedId).toBe(newer.id);
    expect(result!.event.op).toBe('-');
    expect(mockRedis.set).toHaveBeenNthCalledWith(1, 'kicktrack:test:trade', [older]);
  });

  it('returns null when no entry matches', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    expect(await removeOneByComboFromTrade(TEST_SLUG, 1, null)).toBeNull();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('matches null mutation correctly', async () => {
    const entry = makeEntry({ brainrot_id: 3, mutation_id: null });
    mockRedis.get.mockResolvedValueOnce([entry]).mockResolvedValueOnce([]);
    mockRedis.set.mockResolvedValue('OK');
    const result = await removeOneByComboFromTrade(TEST_SLUG, 3, null);
    expect(result!.removedId).toBe(entry.id);
  });
});

describe('replaceTrade', () => {
  it('writes the validated array', async () => {
    const incoming = [makeEntry({})];
    mockRedis.set.mockResolvedValueOnce('OK');
    await replaceTrade(TEST_SLUG, incoming as any);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:test:trade', incoming);
  });

  it('rejects invalid arrays', async () => {
    await expect(replaceTrade(TEST_SLUG, [{ bogus: true }] as any)).rejects.toThrow();
  });
});
