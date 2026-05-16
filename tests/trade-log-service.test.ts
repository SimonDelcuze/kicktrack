import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRedis } = vi.hoisted(() => ({
  mockRedis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('server-only', () => ({}));

vi.mock('@/server/lib/kv', () => ({
  redis: mockRedis,
  TRADE_LOG_KEY: 'kicktrack:trade:log',
}));

import {
  getTradeLog,
  appendTradeLogEvent,
  removeTradeLogEventById,
  replaceTradeLog,
} from '@/server/services/trade-log';

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
    expect(await getTradeLog()).toEqual([]);
  });

  it('returns array when KV has data', async () => {
    mockRedis.get.mockResolvedValueOnce([sampleEvent]);
    expect(await getTradeLog()).toEqual([sampleEvent]);
  });
});

describe('appendTradeLogEvent', () => {
  it('appends to an empty log', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    mockRedis.set.mockResolvedValueOnce('OK');
    await appendTradeLogEvent(sampleEvent);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:trade:log', [sampleEvent]);
  });

  it('appends to an existing log', async () => {
    const existing = [{ ...sampleEvent, id: '11111111-1111-1111-1111-111111111111' }];
    mockRedis.get.mockResolvedValueOnce(existing);
    mockRedis.set.mockResolvedValueOnce('OK');
    await appendTradeLogEvent(sampleEvent);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:trade:log', [...existing, sampleEvent]);
  });
});

describe('removeTradeLogEventById', () => {
  it('removes the matching event', async () => {
    const other = { ...sampleEvent, id: '11111111-1111-1111-1111-111111111111' };
    mockRedis.get.mockResolvedValueOnce([sampleEvent, other]);
    mockRedis.set.mockResolvedValueOnce('OK');
    const removed = await removeTradeLogEventById(sampleEvent.id);
    expect(removed).toBe(true);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:trade:log', [other]);
  });

  it('returns false when id not found', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    expect(await removeTradeLogEventById('nope')).toBe(false);
  });
});

describe('replaceTradeLog', () => {
  it('writes the validated array', async () => {
    mockRedis.set.mockResolvedValueOnce('OK');
    await replaceTradeLog([sampleEvent]);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:trade:log', [sampleEvent]);
  });

  it('rejects invalid events', async () => {
    await expect(replaceTradeLog([{ bogus: true }] as any)).rejects.toThrow();
  });
});
