import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRedis } = vi.hoisted(() => ({
  mockRedis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
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
  getTradeLog,
  appendTradeLogEvent,
  removeTradeLogEventById,
  replaceTradeLog,
} from '@/server/services/trade-log';

const TEST_SLUG = 'test';
const SIMON_SLUG = 'simontest';

beforeEach(() => {
  vi.clearAllMocks();
});

const sampleEvent = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  ts: '2026-01-01T00:00:00.000Z',
  op: '+' as const,
  brainrot_id: 1,
  mutation_id: null,
};

describe('getTradeLog', () => {
  it('returns empty array when KV is empty', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    expect(await getTradeLog(TEST_SLUG)).toEqual([]);
  });

  it('returns array when KV has data', async () => {
    mockRedis.get.mockResolvedValueOnce([sampleEvent]);
    expect(await getTradeLog(TEST_SLUG)).toEqual([sampleEvent]);
  });

  it('migration: when slug===SIMON_SLUG and slug-key is empty but legacy exists, migrates data', async () => {
    const legacy = [sampleEvent];
    mockRedis.get.mockResolvedValueOnce(null).mockResolvedValueOnce(legacy);
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.del.mockResolvedValueOnce(1);

    const result = await getTradeLog(SIMON_SLUG);
    expect(result).toEqual(legacy);
    expect(mockRedis.set).toHaveBeenCalledWith(`kicktrack:${SIMON_SLUG}:trade:log`, legacy);
    expect(mockRedis.del).toHaveBeenCalledWith('kicktrack:trade:log');
  });

  it('migration: when slug!==SIMON_SLUG and slug-key is empty, returns [] without checking legacy', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    const result = await getTradeLog('otherslug');
    expect(result).toEqual([]);
    expect(mockRedis.get).toHaveBeenCalledTimes(1);
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('migration: when slug-keyed data exists, returns it without reading legacy', async () => {
    const existing = [sampleEvent];
    mockRedis.get.mockResolvedValueOnce(existing);
    const result = await getTradeLog(SIMON_SLUG);
    expect(result).toEqual(existing);
    expect(mockRedis.get).toHaveBeenCalledTimes(1);
  });
});

describe('appendTradeLogEvent', () => {
  it('appends to an empty log', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    mockRedis.set.mockResolvedValueOnce('OK');
    await appendTradeLogEvent(TEST_SLUG, sampleEvent);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:test:trade:log', [sampleEvent]);
  });

  it('appends to an existing log', async () => {
    const existing = [{ ...sampleEvent, id: '11111111-1111-1111-1111-111111111111' }];
    mockRedis.get.mockResolvedValueOnce(existing);
    mockRedis.set.mockResolvedValueOnce('OK');
    await appendTradeLogEvent(TEST_SLUG, sampleEvent);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:test:trade:log', [...existing, sampleEvent]);
  });
});

describe('removeTradeLogEventById', () => {
  it('removes the matching event', async () => {
    const other = { ...sampleEvent, id: '11111111-1111-1111-1111-111111111111' };
    mockRedis.get.mockResolvedValueOnce([sampleEvent, other]);
    mockRedis.set.mockResolvedValueOnce('OK');
    const removed = await removeTradeLogEventById(TEST_SLUG, sampleEvent.id);
    expect(removed).toBe(true);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:test:trade:log', [other]);
  });

  it('returns false when id not found', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    expect(await removeTradeLogEventById(TEST_SLUG, 'nope')).toBe(false);
  });
});

describe('replaceTradeLog', () => {
  it('writes the validated array', async () => {
    mockRedis.set.mockResolvedValueOnce('OK');
    await replaceTradeLog(TEST_SLUG, [sampleEvent]);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:test:trade:log', [sampleEvent]);
  });

  it('rejects invalid events', async () => {
    await expect(replaceTradeLog(TEST_SLUG, [{ bogus: true }] as any)).rejects.toThrow();
  });
});
