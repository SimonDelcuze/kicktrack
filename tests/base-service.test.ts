import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted so the mock factory below can reference these.
const { mockRedis } = vi.hoisted(() => ({
  mockRedis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// `server-only` throws when imported outside a server build; stub it for tests.
vi.mock('server-only', () => ({}));

vi.mock('@/server/lib/kv', () => ({
  redis: mockRedis,
  BASE_KEY: 'kicktrack:base',
}));

import {
  getBase,
  addBrainrot,
  updateBrainrot,
  deleteBrainrot,
  replaceBase,
} from '@/server/services/base';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getBase', () => {
  it('returns empty array when KV has no entry', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    expect(await getBase()).toEqual([]);
  });

  it('returns parsed array when KV has data', async () => {
    const sample = [
      { id: 'a', brainrot_id: 1, mutation_id: null, level: 5, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
    ];
    mockRedis.get.mockResolvedValueOnce(sample);
    expect(await getBase()).toEqual(sample);
  });
});

describe('addBrainrot', () => {
  it('appends a new entry with generated id and timestamps', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    mockRedis.set.mockResolvedValueOnce('OK');

    const result = await addBrainrot({ brainrot_id: 1, mutation_id: null, level: 5 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.entry.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.entry.created_at).toBeTruthy();
    expect(result.entry.updated_at).toBeTruthy();
    expect(result.evictedId).toBeUndefined();
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:base', [result.entry]);
  });

  it('throws when input is invalid', async () => {
    await expect(addBrainrot({ brainrot_id: 1, mutation_id: null, level: 999 } as any))
      .rejects.toThrow();
  });

  it('rejects when base is full and newcomer is weaker than the weakest', async () => {
    // Fill base with 30 strong brainrots (id 14 is the strongest in the catalog).
    const fullBase = Array.from({ length: 30 }, (_, i) => ({
      id: `s${i}-uuid-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`.slice(0, 36),
      brainrot_id: 14,
      mutation_id: 10, // rainbow x30
      level: 75,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }));
    mockRedis.get.mockResolvedValueOnce(fullBase);

    const result = await addBrainrot({ brainrot_id: 1, mutation_id: null, level: 1 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('base_full_too_weak');
    expect(result.newcomerIncome).toBeLessThan(result.worstIncome);
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('evicts the weakest when base is full and newcomer is stronger', async () => {
    const weakestId = '11111111-1111-1111-1111-111111111111';
    const fullBase = [
      // 1 weak entry
      {
        id: weakestId,
        brainrot_id: 1, // Blackhole Goat (lowest base/s)
        mutation_id: null,
        level: 1,
        created_at: 'x',
        updated_at: 'x',
      },
      // 29 strong entries
      ...Array.from({ length: 29 }, (_, i) => ({
        id: `s${i}-uuid-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`.slice(0, 36),
        brainrot_id: 14,
        mutation_id: 10,
        level: 75,
        created_at: 'x',
        updated_at: 'x',
      })),
    ];
    mockRedis.get.mockResolvedValueOnce(fullBase);
    mockRedis.set.mockResolvedValueOnce('OK');

    const result = await addBrainrot({
      brainrot_id: 14, // strong
      mutation_id: 10,
      level: 75,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.evictedId).toBe(weakestId);

    const writtenBase = (mockRedis.set as any).mock.calls[0][1] as Array<{ id: string }>;
    expect(writtenBase.length).toBe(30);
    expect(writtenBase.find((b) => b.id === weakestId)).toBeUndefined();
    expect(writtenBase.find((b) => b.id === result.entry.id)).toBeDefined();
  });
});

describe('updateBrainrot', () => {
  it('updates the matching entry and bumps updated_at', async () => {
    const existing = [
      { id: 'a', brainrot_id: 1, mutation_id: null, level: 5, created_at: 'old', updated_at: 'old' },
    ];
    mockRedis.get.mockResolvedValueOnce(existing);
    mockRedis.set.mockResolvedValueOnce('OK');

    const updated = await updateBrainrot('a', { level: 10 });
    expect(updated?.level).toBe(10);
    expect(updated?.updated_at).not.toBe('old');
  });

  it('returns null when entry not found', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    expect(await updateBrainrot('nope', { level: 10 })).toBeNull();
  });
});

describe('deleteBrainrot', () => {
  it('removes the entry by id', async () => {
    const existing = [
      { id: 'a', brainrot_id: 1, mutation_id: null, level: 5, created_at: 'x', updated_at: 'x' },
      { id: 'b', brainrot_id: 2, mutation_id: null, level: 5, created_at: 'x', updated_at: 'x' },
    ];
    mockRedis.get.mockResolvedValueOnce(existing);
    mockRedis.set.mockResolvedValueOnce('OK');

    const ok = await deleteBrainrot('a');
    expect(ok).toBe(true);
    expect(mockRedis.set).toHaveBeenCalledWith(
      'kicktrack:base',
      [existing[1]],
    );
  });

  it('returns false when id not found', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    expect(await deleteBrainrot('nope')).toBe(false);
  });
});

describe('replaceBase', () => {
  it('writes the validated array', async () => {
    const incoming = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        brainrot_id: 1,
        mutation_id: null,
        level: 5,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ];
    mockRedis.set.mockResolvedValueOnce('OK');
    await replaceBase(incoming as any);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:base', incoming);
  });

  it('rejects invalid arrays', async () => {
    await expect(replaceBase([{ bogus: true }] as any)).rejects.toThrow();
  });

  it('rejects arrays with non-UUID ids', async () => {
    const incoming = [
      { id: 'not-a-uuid', brainrot_id: 1, mutation_id: null, level: 5, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
    ];
    await expect(replaceBase(incoming as any)).rejects.toThrow();
  });
});
