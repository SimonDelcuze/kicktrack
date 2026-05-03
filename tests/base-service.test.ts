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

    expect(result.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.created_at).toBeTruthy();
    expect(result.updated_at).toBeTruthy();
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:base', [result]);
  });

  it('throws when input is invalid', async () => {
    await expect(addBrainrot({ brainrot_id: 1, mutation_id: null, level: 999 } as any))
      .rejects.toThrow();
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
