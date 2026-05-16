# Trade Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Trade` section alongside the existing `Base` section : grouped trade cards with inline `± N` counters, a section-aware `Add` dialog (reused), a persisted transaction log shown in chat style with 5-min visual merging, and Trade-only undo/redo.

**Architecture:** New KV keys (`kicktrack:trade`, `kicktrack:trade:log`) backed by new server services that mirror `base.ts` but without the 30-cap. `DashboardClient` becomes a tab switcher hosting an extracted `BaseSection` and a new `TradeSection`. The existing `AddBrainrotDialog` is refactored to accept a `section` prop, replacing its `Add` button with a `[− N +]` counter. A new `TradeHistoryProvider` powers session-only undo/redo using the same snapshot pattern as the existing `HistoryProvider`, but completely independent.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Server Actions, Vercel KV via `@upstash/redis`, Tailwind + shadcn primitives, React Hook Form (already present, unused here), Vitest.

**Spec :** [`docs/superpowers/specs/2026-05-16-trade-section-design.md`](../specs/2026-05-16-trade-section-design.md).

---

## File map

### New

- `server/services/trade.ts` — trade entry CRUD, mirror of `base.ts` sans eviction.
- `server/services/trade-log.ts` — log persistence (append, remove by id, replace).
- `app/trade/actions.ts` — server actions for trade ops + log restore.
- `shared/utils/trade-merge.ts` — pure 5-min merging algorithm.
- `components/trade/TradeHistoryProvider.tsx` — session-local snapshot stack for trade undo/redo.
- `components/trade/TradeHistoryLog.tsx` — chat-style merged log render.
- `components/trade/TradeStatsHeader.tsx` — sum of max-level income + total count.
- `components/brainrot/TradeCard.tsx` — grouped card with `[− N +]`.
- `components/sections/BaseSection.tsx` — current `DashboardClient` body extracted here.
- `components/sections/TradeSection.tsx` — toolbar (← →, + Add), grid, log.
- `tests/trade-service.test.ts`, `tests/trade-log-service.test.ts`, `tests/trade-merge.test.ts`, `tests/base-remove-by-combo.test.ts`.

### Modified

- `shared/types/index.ts` — add `TradeLogEvent` type.
- `shared/schemas/user-brainrot.ts` — add `tradeLogEventSchema`, `tradeLogArraySchema`.
- `server/lib/kv.ts` — export `TRADE_KEY`, `TRADE_LOG_KEY`.
- `server/services/base.ts` — add `removeOneByComboFromBase`.
- `app/add/actions.ts` — add `removeOneByComboFromBaseAction`, refactor `createBrainrotAction` arg shape if needed (kept compatible).
- `components/dialogs/AddBrainrotDialog.tsx` — pass `section` + `currentEntries` to form.
- `components/brainrot/AddBrainrotForm.tsx` — replace `Add` button by `[− N +]` footer; section-aware ops.
- `components/DashboardClient.tsx` — becomes shell with tab switcher; mounts `TradeHistoryProvider`.
- `app/page.tsx` — load trade + log alongside base.

---

## Task 1 — Add `TradeLogEvent` type and Zod schema

**Files:**
- Modify: `shared/types/index.ts`
- Modify: `shared/schemas/user-brainrot.ts`

- [ ] **Step 1: Add type to `shared/types/index.ts`** — append at the end:

```ts
export type TradeLogEvent = {
  id: string;
  ts: string; // ISO timestamp
  op: '+' | '-';
  brainrot_id: number;
  mutation_id: number | null;
};
```

- [ ] **Step 2: Add Zod schemas to `shared/schemas/user-brainrot.ts`** — append after the existing exports:

```ts
export const tradeLogEventSchema = z.object({
  id: z.string().uuid(),
  ts: z.string().datetime(),
  op: z.enum(['+', '-']),
  brainrot_id: z.number().int().positive(),
  mutation_id: z.number().int().positive().nullable(),
});

export const tradeLogArraySchema = z.array(tradeLogEventSchema);

export type TradeLogEventInput = z.infer<typeof tradeLogEventSchema>;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
rtk git add shared/types/index.ts shared/schemas/user-brainrot.ts
rtk git commit -m "feat(trade): add TradeLogEvent type and zod schema"
```

---

## Task 2 — KV key constants

**Files:**
- Modify: `server/lib/kv.ts`

- [ ] **Step 1: Append two new key exports**

```ts
export const TRADE_KEY = 'kicktrack:trade';
export const TRADE_LOG_KEY = 'kicktrack:trade:log';
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
rtk git add server/lib/kv.ts
rtk git commit -m "feat(trade): add KV key constants for trade + trade log"
```

---

## Task 3 — `server/services/trade-log.ts` with TDD

**Files:**
- Test: `tests/trade-log-service.test.ts`
- Create: `server/services/trade-log.ts`

- [ ] **Step 1: Write the failing test file `tests/trade-log-service.test.ts`**

```ts
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
```

- [ ] **Step 2: Run tests to confirm they fail (file does not exist)**

Run: `rtk pnpm vitest run tests/trade-log-service.test.ts`
Expected: fails with module-not-found.

- [ ] **Step 3: Create `server/services/trade-log.ts`**

```ts
import 'server-only';
import { redis, TRADE_LOG_KEY } from '@/server/lib/kv';
import {
  tradeLogEventSchema,
  tradeLogArraySchema,
  type TradeLogEventInput,
} from '@/shared/schemas/user-brainrot';
import type { TradeLogEvent } from '@/shared/types';

export async function getTradeLog(): Promise<TradeLogEvent[]> {
  const raw = await redis.get<TradeLogEvent[]>(TRADE_LOG_KEY);
  return raw ?? [];
}

export async function appendTradeLogEvent(event: TradeLogEventInput): Promise<void> {
  const validated = tradeLogEventSchema.parse(event);
  const current = await getTradeLog();
  await redis.set(TRADE_LOG_KEY, [...current, validated]);
}

export async function removeTradeLogEventById(id: string): Promise<boolean> {
  const current = await getTradeLog();
  const next = current.filter((e) => e.id !== id);
  if (next.length === current.length) return false;
  await redis.set(TRADE_LOG_KEY, next);
  return true;
}

export async function replaceTradeLog(events: TradeLogEvent[]): Promise<void> {
  const validated = tradeLogArraySchema.parse(events);
  await redis.set(TRADE_LOG_KEY, validated);
}
```

- [ ] **Step 4: Re-run tests**

Run: `rtk pnpm vitest run tests/trade-log-service.test.ts`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
rtk git add server/services/trade-log.ts tests/trade-log-service.test.ts
rtk git commit -m "feat(trade): trade log service with append/remove/replace"
```

---

## Task 4 — `server/services/trade.ts` with TDD

**Files:**
- Test: `tests/trade-service.test.ts`
- Create: `server/services/trade.ts`

- [ ] **Step 1: Write `tests/trade-service.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRedis } = vi.hoisted(() => ({
  mockRedis: { get: vi.fn(), set: vi.fn() },
}));

vi.mock('server-only', () => ({}));
vi.mock('@/server/lib/kv', () => ({
  redis: mockRedis,
  TRADE_KEY: 'kicktrack:trade',
  TRADE_LOG_KEY: 'kicktrack:trade:log',
}));

import {
  getTrade,
  addToTrade,
  removeOneByComboFromTrade,
  replaceTrade,
} from '@/server/services/trade';

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
    expect(await getTrade()).toEqual([]);
  });
});

describe('addToTrade', () => {
  it('appends a new entry with generated id, level=1, and returns the corresponding event', async () => {
    // First call = getTrade, second call = getTradeLog
    mockRedis.get.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockRedis.set.mockResolvedValue('OK');

    const result = await addToTrade(1, 7);

    expect(result.entry.brainrot_id).toBe(1);
    expect(result.entry.mutation_id).toBe(7);
    expect(result.entry.level).toBe(1);
    expect(result.entry.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.event.op).toBe('+');
    expect(result.event.brainrot_id).toBe(1);
    expect(result.event.mutation_id).toBe(7);

    // Two writes: trade then log
    expect(mockRedis.set).toHaveBeenCalledTimes(2);
    expect(mockRedis.set).toHaveBeenNthCalledWith(1, 'kicktrack:trade', [result.entry]);
    expect(mockRedis.set).toHaveBeenNthCalledWith(2, 'kicktrack:trade:log', [result.event]);
  });

  it('accepts a null mutation', async () => {
    mockRedis.get.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockRedis.set.mockResolvedValue('OK');
    const result = await addToTrade(2, null);
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

    const result = await removeOneByComboFromTrade(1, 7);

    expect(result).not.toBeNull();
    expect(result!.removedId).toBe(newer.id);
    expect(result!.event.op).toBe('-');
    expect(mockRedis.set).toHaveBeenNthCalledWith(1, 'kicktrack:trade', [older]);
  });

  it('returns null when no entry matches', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    expect(await removeOneByComboFromTrade(1, null)).toBeNull();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('matches null mutation correctly', async () => {
    const entry = makeEntry({ brainrot_id: 3, mutation_id: null });
    mockRedis.get.mockResolvedValueOnce([entry]).mockResolvedValueOnce([]);
    mockRedis.set.mockResolvedValue('OK');
    const result = await removeOneByComboFromTrade(3, null);
    expect(result!.removedId).toBe(entry.id);
  });
});

describe('replaceTrade', () => {
  it('writes the validated array', async () => {
    const incoming = [makeEntry({})];
    mockRedis.set.mockResolvedValueOnce('OK');
    await replaceTrade(incoming as any);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:trade', incoming);
  });

  it('rejects invalid arrays', async () => {
    await expect(replaceTrade([{ bogus: true }] as any)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests, confirm fail**

Run: `rtk pnpm vitest run tests/trade-service.test.ts`
Expected: module-not-found.

- [ ] **Step 3: Create `server/services/trade.ts`**

```ts
import 'server-only';
import { v4 as uuidv4 } from 'uuid';
import { redis, TRADE_KEY, TRADE_LOG_KEY } from '@/server/lib/kv';
import {
  userBrainrotArraySchema,
  tradeLogEventSchema,
} from '@/shared/schemas/user-brainrot';
import type { TradeLogEvent, UserBrainrot } from '@/shared/types';

export async function getTrade(): Promise<UserBrainrot[]> {
  const raw = await redis.get<UserBrainrot[]>(TRADE_KEY);
  return raw ?? [];
}

export async function addToTrade(
  brainrot_id: number,
  mutation_id: number | null,
): Promise<{ entry: UserBrainrot; event: TradeLogEvent }> {
  const now = new Date().toISOString();
  const entry: UserBrainrot = {
    id: uuidv4(),
    brainrot_id,
    mutation_id,
    level: 1,
    created_at: now,
    updated_at: now,
  };
  const event: TradeLogEvent = {
    id: uuidv4(),
    ts: now,
    op: '+',
    brainrot_id,
    mutation_id,
  };

  const trade = await getTrade();
  await redis.set(TRADE_KEY, [...trade, entry]);

  const log = await redis.get<TradeLogEvent[]>(TRADE_LOG_KEY) ?? [];
  await redis.set(TRADE_LOG_KEY, [...log, tradeLogEventSchema.parse(event)]);

  return { entry, event };
}

export async function removeOneByComboFromTrade(
  brainrot_id: number,
  mutation_id: number | null,
): Promise<{ removedId: string; event: TradeLogEvent } | null> {
  const trade = await getTrade();
  // Most-recent first by created_at.
  const sortedDesc = [...trade].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const target = sortedDesc.find(
    (e) => e.brainrot_id === brainrot_id && e.mutation_id === mutation_id,
  );
  if (!target) return null;

  const next = trade.filter((e) => e.id !== target.id);
  await redis.set(TRADE_KEY, next);

  const event: TradeLogEvent = {
    id: uuidv4(),
    ts: new Date().toISOString(),
    op: '-',
    brainrot_id,
    mutation_id,
  };
  const log = await redis.get<TradeLogEvent[]>(TRADE_LOG_KEY) ?? [];
  await redis.set(TRADE_LOG_KEY, [...log, tradeLogEventSchema.parse(event)]);

  return { removedId: target.id, event };
}

export async function replaceTrade(entries: UserBrainrot[]): Promise<void> {
  const validated = userBrainrotArraySchema.parse(entries);
  await redis.set(TRADE_KEY, validated);
}
```

- [ ] **Step 4: Re-run tests**

Run: `rtk pnpm vitest run tests/trade-service.test.ts`
Expected: green.

- [ ] **Step 5: Commit**

```bash
rtk git add server/services/trade.ts tests/trade-service.test.ts
rtk git commit -m "feat(trade): trade service (add/remove-by-combo/replace) writing log events"
```

---

## Task 5 — Extend `base.ts` with `removeOneByComboFromBase`

**Files:**
- Test: `tests/base-remove-by-combo.test.ts`
- Modify: `server/services/base.ts`

- [ ] **Step 1: Write `tests/base-remove-by-combo.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRedis } = vi.hoisted(() => ({
  mockRedis: { get: vi.fn(), set: vi.fn() },
}));
vi.mock('server-only', () => ({}));
vi.mock('@/server/lib/kv', () => ({
  redis: mockRedis,
  BASE_KEY: 'kicktrack:base',
}));

import { removeOneByComboFromBase } from '@/server/services/base';

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

    const result = await removeOneByComboFromBase(1, 7, 1);

    expect(result?.removedId).toBe(newer.id);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:base', [older]);
  });

  it('returns null when nothing matches', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    expect(await removeOneByComboFromBase(1, null, 1)).toBeNull();
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
    expect((await removeOneByComboFromBase(3, null, 1))?.removedId).toBe(entry.id);
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
    const result = await removeOneByComboFromBase(1, null, 5);
    expect(result?.removedId).toBe(lvl5.id);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:base', [lvl1]);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `rtk pnpm vitest run tests/base-remove-by-combo.test.ts`
Expected: import error (export missing).

- [ ] **Step 3: Append `removeOneByComboFromBase` to `server/services/base.ts`**

Insert before the final closing `};` of the file (after `replaceBase`):

```ts
export async function removeOneByComboFromBase(
  brainrot_id: number,
  mutation_id: number | null,
  level: number,
): Promise<{ removedId: string } | null> {
  const base = await getBase();
  const sortedDesc = [...base].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const target = sortedDesc.find(
    (e) =>
      e.brainrot_id === brainrot_id &&
      e.mutation_id === mutation_id &&
      e.level === level,
  );
  if (!target) return null;
  const next = base.filter((e) => e.id !== target.id);
  await redis.set(BASE_KEY, next);
  return { removedId: target.id };
}
```

- [ ] **Step 4: Re-run tests**

Run: `rtk pnpm vitest run tests/base-remove-by-combo.test.ts`
Expected: green.

- [ ] **Step 5: Commit**

```bash
rtk git add server/services/base.ts tests/base-remove-by-combo.test.ts
rtk git commit -m "feat(base): add removeOneByComboFromBase for the ± counter"
```

---

## Task 6 — Pure utility `shared/utils/trade-merge.ts` with TDD

**Files:**
- Test: `tests/trade-merge.test.ts`
- Create: `shared/utils/trade-merge.ts`

- [ ] **Step 1: Write `tests/trade-merge.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { mergeTradeLog } from '@/shared/utils/trade-merge';
import type { TradeLogEvent } from '@/shared/types';

const FIVE_MIN_MS = 5 * 60 * 1000;

function event(
  ts: string,
  op: '+' | '-',
  brainrot_id: number,
  mutation_id: number | null,
  id: string = `e-${ts}-${op}-${brainrot_id}-${mutation_id}`,
): TradeLogEvent {
  return { id, ts, op, brainrot_id, mutation_id };
}

describe('mergeTradeLog', () => {
  it('returns [] for empty input', () => {
    expect(mergeTradeLog([])).toEqual([]);
  });

  it('keeps a single event as its own group', () => {
    const e = event('2026-01-01T00:00:00.000Z', '+', 1, null);
    expect(mergeTradeLog([e])).toEqual([
      { count: 1, op: '+', brainrot_id: 1, mutation_id: null, firstTs: e.ts, lastTs: e.ts, eventIds: [e.id] },
    ]);
  });

  it('merges consecutive same-op same-combo events within 5min', () => {
    const t0 = new Date('2026-01-01T12:00:00.000Z').toISOString();
    const t2m = new Date('2026-01-01T12:02:00.000Z').toISOString();
    const t4m = new Date('2026-01-01T12:04:00.000Z').toISOString();
    const events = [
      event(t0, '+', 1, 7),
      event(t2m, '+', 1, 7),
      event(t4m, '+', 1, 7),
    ];
    const merged = mergeTradeLog(events);
    expect(merged).toHaveLength(1);
    expect(merged[0].count).toBe(3);
    expect(merged[0].firstTs).toBe(t0);
    expect(merged[0].lastTs).toBe(t4m);
  });

  it('splits when the next event is > 5min after the FIRST event of the group', () => {
    const t0 = new Date('2026-01-01T12:00:00.000Z').toISOString();
    const t4m = new Date('2026-01-01T12:04:00.000Z').toISOString();
    const t6m = new Date('2026-01-01T12:06:00.000Z').toISOString();
    const events = [
      event(t0, '+', 1, 7),
      event(t4m, '+', 1, 7),
      event(t6m, '+', 1, 7),
    ];
    const merged = mergeTradeLog(events);
    expect(merged).toHaveLength(2);
    expect(merged[0].count).toBe(2);
    expect(merged[1].count).toBe(1);
    expect(merged[1].firstTs).toBe(t6m);
  });

  it('splits on different op', () => {
    const t0 = new Date('2026-01-01T12:00:00.000Z').toISOString();
    const t1m = new Date('2026-01-01T12:01:00.000Z').toISOString();
    const events = [
      event(t0, '+', 1, 7),
      event(t1m, '-', 1, 7),
    ];
    expect(mergeTradeLog(events)).toHaveLength(2);
  });

  it('splits on different combo', () => {
    const t0 = new Date('2026-01-01T12:00:00.000Z').toISOString();
    const t1m = new Date('2026-01-01T12:01:00.000Z').toISOString();
    const events = [
      event(t0, '+', 1, 7),
      event(t1m, '+', 2, 7),
    ];
    expect(mergeTradeLog(events)).toHaveLength(2);
  });

  it('treats null mutation as a distinct combo from a numeric one', () => {
    const t0 = new Date('2026-01-01T12:00:00.000Z').toISOString();
    const t1m = new Date('2026-01-01T12:01:00.000Z').toISOString();
    const events = [
      event(t0, '+', 1, null),
      event(t1m, '+', 1, 7),
    ];
    expect(mergeTradeLog(events)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `rtk pnpm vitest run tests/trade-merge.test.ts`
Expected: import error.

- [ ] **Step 3: Create `shared/utils/trade-merge.ts`**

```ts
import type { TradeLogEvent } from '@/shared/types';

export type MergedTradeGroup = {
  count: number;
  op: '+' | '-';
  brainrot_id: number;
  mutation_id: number | null;
  firstTs: string;
  lastTs: string;
  eventIds: string[];
};

const FIVE_MIN_MS = 5 * 60 * 1000;

export function mergeTradeLog(events: readonly TradeLogEvent[]): MergedTradeGroup[] {
  const groups: MergedTradeGroup[] = [];

  for (const e of events) {
    const last = groups[groups.length - 1];
    const sameCombo =
      last &&
      last.op === e.op &&
      last.brainrot_id === e.brainrot_id &&
      last.mutation_id === e.mutation_id;
    const withinWindow =
      last && Date.parse(e.ts) - Date.parse(last.firstTs) <= FIVE_MIN_MS;

    if (sameCombo && withinWindow) {
      last.count += 1;
      last.lastTs = e.ts;
      last.eventIds.push(e.id);
    } else {
      groups.push({
        count: 1,
        op: e.op,
        brainrot_id: e.brainrot_id,
        mutation_id: e.mutation_id,
        firstTs: e.ts,
        lastTs: e.ts,
        eventIds: [e.id],
      });
    }
  }

  return groups;
}
```

- [ ] **Step 4: Re-run tests**

Run: `rtk pnpm vitest run tests/trade-merge.test.ts`
Expected: green.

- [ ] **Step 5: Commit**

```bash
rtk git add shared/utils/trade-merge.ts tests/trade-merge.test.ts
rtk git commit -m "feat(trade): pure merge utility grouping events by 5min windows"
```

---

## Task 7 — Server actions for trade + extension for base remove-by-combo

**Files:**
- Create: `app/trade/actions.ts`
- Modify: `app/add/actions.ts`

- [ ] **Step 1: Create `app/trade/actions.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import {
  getTrade,
  addToTrade,
  removeOneByComboFromTrade,
  replaceTrade,
} from '@/server/services/trade';
import {
  getTradeLog,
  replaceTradeLog,
} from '@/server/services/trade-log';
import type { TradeLogEvent, UserBrainrot } from '@/shared/types';

export type TradeMutationResult = {
  ok: boolean;
  previousTrade: UserBrainrot[];
  previousLog: TradeLogEvent[];
};

export async function addToTradeAction(
  brainrot_id: number,
  mutation_id: number | null,
): Promise<TradeMutationResult> {
  const previousTrade = await getTrade();
  const previousLog = await getTradeLog();
  await addToTrade(brainrot_id, mutation_id);
  revalidatePath('/');
  return { ok: true, previousTrade, previousLog };
}

export async function removeOneFromTradeAction(
  brainrot_id: number,
  mutation_id: number | null,
): Promise<TradeMutationResult> {
  const previousTrade = await getTrade();
  const previousLog = await getTradeLog();
  const removed = await removeOneByComboFromTrade(brainrot_id, mutation_id);
  if (removed) revalidatePath('/');
  return { ok: removed !== null, previousTrade, previousLog };
}

export async function setTradeAndLogAction(
  nextTrade: UserBrainrot[],
  nextLog: TradeLogEvent[],
): Promise<{ previousTrade: UserBrainrot[]; previousLog: TradeLogEvent[] }> {
  const previousTrade = await getTrade();
  const previousLog = await getTradeLog();
  await replaceTrade(nextTrade);
  await replaceTradeLog(nextLog);
  revalidatePath('/');
  return { previousTrade, previousLog };
}
```

- [ ] **Step 2: Extend `app/add/actions.ts`** — append to the end of the existing file:

```ts
import { removeOneByComboFromBase } from '@/server/services/base';

export async function removeOneByComboFromBaseAction(
  brainrot_id: number,
  mutation_id: number | null,
  level: number,
): Promise<{ ok: boolean; previousBase: UserBrainrot[] }> {
  const previousBase = await getBase();
  const removed = await removeOneByComboFromBase(brainrot_id, mutation_id, level);
  if (removed) revalidatePath('/');
  return { ok: removed !== null, previousBase };
}
```

Note: `getBase` and `UserBrainrot` are already imported in `app/add/actions.ts`. Merge the new import into the existing `import { addBrainrot, getBase, type AddResult } from '@/server/services/base'` line to keep imports tidy:

```ts
import { addBrainrot, getBase, removeOneByComboFromBase, type AddResult } from '@/server/services/base';
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
rtk git add app/trade/actions.ts app/add/actions.ts
rtk git commit -m "feat(trade): server actions for add/remove/restore + base remove-by-combo action"
```

---

## Task 8 — `TradeHistoryProvider`

**Files:**
- Create: `components/trade/TradeHistoryProvider.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { setTradeAndLogAction } from '@/app/trade/actions';
import type { TradeLogEvent, UserBrainrot } from '@/shared/types';

const MAX_HISTORY = 50;

type Snapshot = { trade: UserBrainrot[]; log: TradeLogEvent[] };

type TradeHistoryContextValue = {
  canUndo: boolean;
  canRedo: boolean;
  recordMutation: (snapshot: Snapshot) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
};

const TradeHistoryContext = createContext<TradeHistoryContextValue | null>(null);

export function TradeHistoryProvider({ children }: { children: ReactNode }) {
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);

  const recordMutation = useCallback((snapshot: Snapshot) => {
    setPast((p) => [...p, snapshot].slice(-MAX_HISTORY));
    setFuture([]);
  }, []);

  const undo = useCallback(async () => {
    if (past.length === 0) return;
    const target = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    try {
      const { previousTrade, previousLog } = await setTradeAndLogAction(target.trade, target.log);
      setFuture((f) => [{ trade: previousTrade, log: previousLog }, ...f].slice(0, MAX_HISTORY));
    } catch (e) {
      setPast((p) => [...p, target]);
      toast.error('Trade undo failed.');
      console.error(e);
    }
  }, [past]);

  const redo = useCallback(async () => {
    if (future.length === 0) return;
    const target = future[0];
    setFuture((f) => f.slice(1));
    try {
      const { previousTrade, previousLog } = await setTradeAndLogAction(target.trade, target.log);
      setPast((p) => [...p, { trade: previousTrade, log: previousLog }].slice(-MAX_HISTORY));
    } catch (e) {
      setFuture((f) => [target, ...f]);
      toast.error('Trade redo failed.');
      console.error(e);
    }
  }, [future]);

  const value: TradeHistoryContextValue = {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    recordMutation,
    undo,
    redo,
  };

  return <TradeHistoryContext.Provider value={value}>{children}</TradeHistoryContext.Provider>;
}

export function useTradeHistory(): TradeHistoryContextValue {
  const ctx = useContext(TradeHistoryContext);
  if (!ctx) {
    throw new Error('useTradeHistory must be used within TradeHistoryProvider');
  }
  return ctx;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
rtk git add components/trade/TradeHistoryProvider.tsx
rtk git commit -m "feat(trade): TradeHistoryProvider — session-only undo/redo independent from base"
```

---

## Task 9 — `TradeCard` component

**Files:**
- Create: `components/brainrot/TradeCard.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/shared/utils/format';
import { MAX_LEVEL, currentMoneyPerSec } from '@/shared/utils/calculations';
import { MutationChip } from '@/components/brainrot/MutationChip';
import type { Brainrot, Mutation } from '@/shared/types';

type Props = {
  brainrot: Brainrot;
  mutation: Mutation | null;
  count: number;
  onIncrement: () => Promise<void> | void;
  onDecrement: () => Promise<void> | void;
};

export function TradeCard({ brainrot, mutation, count, onIncrement, onDecrement }: Props) {
  const [pending, setPending] = useState(false);
  const baseIncome = currentMoneyPerSec(brainrot, 1, mutation);
  const maxIncome = currentMoneyPerSec(brainrot, MAX_LEVEL, mutation);

  async function handle(op: () => Promise<void> | void) {
    setPending(true);
    try {
      await op();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left min-h-[160px]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold leading-tight text-foreground">
          {brainrot.name}
        </div>
        <span className="shrink-0 rounded-md bg-foreground/10 px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-foreground">
          ×{count}
        </span>
      </div>

      {mutation && <MutationChip mutation={mutation} variant="chip" />}

      <div className="font-mono text-xs tabular-nums text-muted-foreground">
        <div className="flex justify-between">
          <span>Base</span>
          <span>{formatNumber(baseIncome)}</span>
        </div>
        <div className="flex justify-between">
          <span>Max</span>
          <span>{formatNumber(maxIncome)}</span>
        </div>
      </div>

      <div className="mt-auto flex items-stretch justify-between gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => handle(onDecrement)}
          disabled={pending || count === 0}
          aria-label="Remove one"
          className={cn(
            'flex-1 rounded-md border border-border bg-card font-mono text-base font-semibold transition-colors',
            'hover:border-foreground/40',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          −
        </button>
        <span className="flex min-w-[2.5rem] items-center justify-center font-mono text-base font-semibold tabular-nums">
          {count}
        </span>
        <button
          type="button"
          onClick={() => handle(onIncrement)}
          disabled={pending}
          aria-label="Add one"
          className={cn(
            'flex-1 rounded-md border border-border bg-card font-mono text-base font-semibold transition-colors',
            'hover:border-foreground/40',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          +
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
rtk git add components/brainrot/TradeCard.tsx
rtk git commit -m "feat(trade): TradeCard with name, mutation chip, base/max income, count badge, ± controls"
```

---

## Task 10 — `TradeHistoryLog` component

**Files:**
- Create: `components/trade/TradeHistoryLog.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { mergeTradeLog } from '@/shared/utils/trade-merge';
import { mutationById } from '@/shared/data/mutations';
import type { Brainrot, TradeLogEvent } from '@/shared/types';

type Props = {
  events: readonly TradeLogEvent[];
  brainrots: readonly Brainrot[];
};

export function TradeHistoryLog({ events, brainrots }: Props) {
  const groups = useMemo(() => mergeTradeLog(events), [events]);

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-xs text-muted-foreground">
        No transactions yet.
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {groups.map((g, idx) => {
        const brainrot = brainrots.find((b) => b.id === g.brainrot_id);
        const mutation = g.mutation_id != null ? mutationById(g.mutation_id) : null;
        const name = brainrot?.name ?? `#${g.brainrot_id}`;
        const mutLabel = mutation ? ` ${mutation.name}` : '';
        const timeLabel = new Date(g.lastTs).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <li
            key={`${g.firstTs}-${idx}`}
            className="flex items-baseline gap-3 rounded-lg border border-border bg-card px-3 py-2"
          >
            <span
              className={cn(
                'font-mono text-sm font-semibold tabular-nums',
                g.op === '+' ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              {g.op}
              {g.count}
            </span>
            <span className="text-sm text-foreground">
              {name}
              <span className="text-muted-foreground">{mutLabel}</span>
            </span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              {timeLabel}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
rtk git add components/trade/TradeHistoryLog.tsx
rtk git commit -m "feat(trade): chat-style log with 5min merging and +/- color coding"
```

---

## Task 11 — `TradeStatsHeader` component

**Files:**
- Create: `components/trade/TradeStatsHeader.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { formatNumber } from '@/shared/utils/format';
import { MAX_LEVEL, currentMoneyPerSec } from '@/shared/utils/calculations';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';

type Props = {
  entries: readonly UserBrainrot[];
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

export function TradeStatsHeader({ entries, brainrots, mutations }: Props) {
  const totalMax = entries.reduce((sum, ub) => {
    const brainrot = brainrots.find((b) => b.id === ub.brainrot_id);
    if (!brainrot) return sum;
    const mutation = ub.mutation_id != null
      ? mutations.find((m) => m.id === ub.mutation_id) ?? null
      : null;
    return sum + currentMoneyPerSec(brainrot, MAX_LEVEL, mutation);
  }, 0);

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Max-level total (×{MAX_LEVEL})
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-5xl font-semibold tracking-tight tabular-nums">
            {formatNumber(totalMax)}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Brainrots in trade
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-5xl font-semibold tabular-nums">
            {entries.length}
          </span>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
rtk git add components/trade/TradeStatsHeader.tsx
rtk git commit -m "feat(trade): TradeStatsHeader showing max-lvl total and count"
```

---

## Task 12 — Refactor `AddBrainrotForm` and `AddBrainrotDialog` to be section-aware

**Files:**
- Modify: `components/brainrot/AddBrainrotForm.tsx`
- Modify: `components/dialogs/AddBrainrotDialog.tsx`

- [ ] **Step 1: Rewrite `components/brainrot/AddBrainrotForm.tsx`** entirely:

```tsx
'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';
import {
  createBrainrotAction,
  removeOneByComboFromBaseAction,
} from '@/app/add/actions';
import {
  addToTradeAction,
  removeOneFromTradeAction,
} from '@/app/trade/actions';
import { formatNumber } from '@/shared/utils/format';
import { RAINBOW_MUTATION_ID } from '@/shared/data/mutations';
import { needsLightText } from '@/shared/utils/contrast';

type Section = 'base' | 'trade';

type Props = {
  section: Section;
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
  currentEntries: readonly UserBrainrot[];
  onMutatedBase?: (previousBase: UserBrainrot[]) => void;
  onMutatedTrade?: (previousTrade: UserBrainrot[], previousLog: import('@/shared/types').TradeLogEvent[]) => void;
};

export function AddBrainrotForm({
  section,
  brainrots,
  mutations,
  currentEntries,
  onMutatedBase,
  onMutatedTrade,
}: Props) {
  const [brainrotId, setBrainrotId] = useState<number | null>(null);
  const [mutationId, setMutationId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...brainrots].sort((a, b) => a.base_money_per_sec - b.base_money_per_sec);
    if (!q) return sorted;
    return sorted.filter((b) => b.name.toLowerCase().includes(q));
  }, [brainrots, search]);

  const count = useMemo(() => {
    if (brainrotId === null) return 0;
    return currentEntries.filter(
      (e) => e.brainrot_id === brainrotId && e.mutation_id === mutationId && e.level === 1,
    ).length;
  }, [currentEntries, brainrotId, mutationId]);

  async function handleIncrement() {
    if (brainrotId === null) return;
    setPending(true);
    try {
      if (section === 'base') {
        const formData = new FormData();
        formData.set('brainrot_id', String(brainrotId));
        formData.set('mutation_id', mutationId === null ? 'null' : String(mutationId));
        formData.set('level', '1');
        const result = await createBrainrotAction(formData);
        if (result.ok) {
          onMutatedBase?.(result.previousBase);
          toast.success('Added to base.');
        } else if (result.error === 'base_full_too_weak') {
          toast.error('Base is full — this brainrot is weaker than your weakest.', {
            description: `${formatNumber(result.newcomerIncome)}/s vs ${formatNumber(result.worstIncome)}/s`,
          });
        }
      } else {
        const result = await addToTradeAction(brainrotId, mutationId);
        if (result.ok) {
          onMutatedTrade?.(result.previousTrade, result.previousLog);
          toast.success('Added to trade.');
        }
      }
    } finally {
      setPending(false);
    }
  }

  async function handleDecrement() {
    if (brainrotId === null || count === 0) return;
    setPending(true);
    try {
      if (section === 'base') {
        const result = await removeOneByComboFromBaseAction(brainrotId, mutationId, 1);
        if (result.ok) {
          onMutatedBase?.(result.previousBase);
          toast.success('Removed from base.');
        }
      } else {
        const result = await removeOneFromTradeAction(brainrotId, mutationId);
        if (result.ok) {
          onMutatedTrade?.(result.previousTrade, result.previousLog);
          toast.success('Removed from trade.');
        }
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Input
        type="search"
        placeholder="Search brainrots…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-10"
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          No brainrot matches “{search}”.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((b) => {
            const isSelected = brainrotId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBrainrotId(b.id)}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors',
                  isSelected
                    ? 'border-foreground bg-foreground/5'
                    : 'border-border bg-card hover:border-foreground/40',
                )}
              >
                <span className="text-[13px] font-semibold leading-tight text-foreground">
                  {b.name}
                </span>
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {formatNumber(b.base_money_per_sec)}
                  <span className="ml-0.5 text-xs">/s</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <MutationGrid mutations={mutations} selectedId={mutationId} onSelect={setMutationId} />

      <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={brainrotId === null || pending || count === 0}
            aria-label="Remove one"
            className={cn(
              'h-11 w-14 rounded-md border border-border bg-card font-mono text-lg font-semibold',
              'hover:border-foreground/40',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            −
          </button>
          <span className="flex h-11 min-w-[3rem] items-center justify-center font-mono text-lg font-semibold tabular-nums">
            {count}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={brainrotId === null || pending}
            aria-label="Add one"
            className={cn(
              'h-11 w-14 rounded-md border border-foreground bg-foreground font-mono text-lg font-semibold text-background',
              'hover:opacity-90',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

type MutationGridProps = {
  mutations: readonly Mutation[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
};

export function MutationGrid({ mutations, selectedId, onSelect }: MutationGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      <MutationCardButton
        label="None"
        multiplier="×1"
        selected={selectedId === null}
        onClick={() => onSelect(null)}
      />
      {mutations.map((m) => (
        <MutationCardButton
          key={m.id}
          label={m.name}
          multiplier={`×${m.multiplier}`}
          color={m.color_hex}
          isRainbow={m.id === RAINBOW_MUTATION_ID}
          selected={selectedId === m.id}
          onClick={() => onSelect(m.id)}
        />
      ))}
    </div>
  );
}

type CardButtonProps = {
  label: string;
  multiplier: string;
  color?: string;
  isRainbow?: boolean;
  selected: boolean;
  onClick: () => void;
};

function MutationCardButton({
  label,
  multiplier,
  color,
  isRainbow,
  selected,
  onClick,
}: CardButtonProps) {
  const colored = !!color && !isRainbow;
  const light = colored && needsLightText(color);

  const baseClass =
    'flex flex-col items-start justify-between gap-2 rounded-xl border p-3 text-left transition-all min-h-[88px]';
  const stateClass = selected
    ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
    : 'hover:scale-[1.01]';

  let variantClass: string;
  let style: React.CSSProperties | undefined;
  if (isRainbow) {
    variantClass = 'bg-rainbow text-black border-black/10';
  } else if (colored) {
    variantClass = 'border-black/10';
    style = {
      backgroundColor: color,
      color: light ? '#fafafa' : '#0a0a0a',
    };
  } else {
    variantClass = 'border-border bg-card text-foreground';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(baseClass, variantClass, stateClass)}
      style={style}
      aria-pressed={selected}
    >
      <span className="text-[13px] font-bold uppercase tracking-wide leading-none">
        {label}
      </span>
      <span className="font-mono text-base font-semibold tabular-nums">{multiplier}</span>
    </button>
  );
}
```

- [ ] **Step 2: Rewrite `components/dialogs/AddBrainrotDialog.tsx`**

```tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddBrainrotForm } from '@/components/brainrot/AddBrainrotForm';
import type { Brainrot, Mutation, TradeLogEvent, UserBrainrot } from '@/shared/types';

type Section = 'base' | 'trade';

type Props = {
  section: Section;
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
  currentEntries: readonly UserBrainrot[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMutatedBase?: (previousBase: UserBrainrot[]) => void;
  onMutatedTrade?: (previousTrade: UserBrainrot[], previousLog: TradeLogEvent[]) => void;
  disabled?: boolean;
};

export function AddBrainrotDialog({
  section,
  brainrots,
  mutations,
  currentEntries,
  open,
  onOpenChange,
  onMutatedBase,
  onMutatedTrade,
  disabled = false,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button disabled={disabled}>+ Add</Button>} />
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto p-6 sm:max-w-5xl md:p-8">
        <DialogTitle className="sr-only">Add brainrot</DialogTitle>
        <DialogDescription className="sr-only">
          Pick a brainrot and an optional mutation. Use the ± footer to add or remove.
        </DialogDescription>
        <AddBrainrotForm
          section={section}
          brainrots={brainrots}
          mutations={mutations}
          currentEntries={currentEntries}
          onMutatedBase={onMutatedBase}
          onMutatedTrade={onMutatedTrade}
        />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: TS errors in `components/DashboardClient.tsx` (consumer not yet updated). That's expected — Task 13 fixes it. Do NOT commit yet — wait until Task 13 makes the tree compile again.

- [ ] **Step 4: Stage but don't commit yet**

```bash
rtk git add components/brainrot/AddBrainrotForm.tsx components/dialogs/AddBrainrotDialog.tsx
```

(Commit will happen after Task 13 so the tree always compiles between commits.)

---

## Task 13 — Extract `BaseSection`

**Files:**
- Create: `components/sections/BaseSection.tsx`
- Modify: `components/DashboardClient.tsx` (becomes section shell — done fully in Task 14, but we make `BaseSection` standalone here)

- [ ] **Step 1: Create `components/sections/BaseSection.tsx`** — moves the body of the existing `DashboardClient` into a dedicated component, adapted to the new `AddBrainrotDialog` prop shape :

```tsx
'use client';

import { useState, useMemo } from 'react';
import { BrainrotCard } from '@/components/brainrot/BrainrotCard';
import { AddBrainrotDialog } from '@/components/dialogs/AddBrainrotDialog';
import { EditBrainrotDialog } from '@/components/dialogs/EditBrainrotDialog';
import { StatsHeader } from '@/components/stats/StatsHeader';
import { currentMoneyPerSec, totalIncome } from '@/shared/utils/calculations';
import { useHistory } from '@/components/HistoryProvider';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';

const MAX_BASE_SIZE = 30;

type Props = {
  base: UserBrainrot[];
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

export function BaseSection({ base, brainrots, mutations }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<string[]>([]);
  const { recordMutation } = useHistory();

  const editing = editingId ? base.find((b) => b.id === editingId) ?? null : null;
  const total = totalIncome(base, { brainrots, mutations });

  const enriched = useMemo(() => {
    return base
      .map((user) => {
        const brainrot = brainrots.find((b) => b.id === user.brainrot_id);
        if (!brainrot) return null;
        const mutation =
          user.mutation_id != null
            ? mutations.find((m) => m.id === user.mutation_id) ?? null
            : null;
        return {
          user,
          brainrot,
          mutation,
          income: currentMoneyPerSec(brainrot, user.level, mutation),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.income - a.income);
  }, [base, brainrots, mutations]);

  const isFull = base.length >= MAX_BASE_SIZE;

  function handleAddOpenChange(open: boolean) {
    setAddOpen(open);
    if (open) setRecentlyAddedIds([]);
  }

  return (
    <div className="space-y-12">
      <StatsHeader totalIncomePerSec={total} count={base.length} />

      <section>
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Your base</h2>
          <AddBrainrotDialog
            section="base"
            brainrots={brainrots}
            mutations={mutations}
            currentEntries={base}
            open={addOpen}
            onOpenChange={handleAddOpenChange}
            onMutatedBase={recordMutation}
          />
        </header>

        {base.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {enriched.map((entry, idx) => (
              <BrainrotCard
                key={entry.user.id}
                user={entry.user}
                brainrot={entry.brainrot}
                mutation={entry.mutation}
                position={idx + 1}
                isRecent={recentlyAddedIds.includes(entry.user.id)}
                onClick={() => setEditingId(entry.user.id)}
              />
            ))}
          </div>
        )}

        {isFull && (
          <p className="mt-5 text-xs text-muted-foreground">
            Base full · adding a stronger brainrot evicts the weakest.
          </p>
        )}

        <EditBrainrotDialog
          open={editing !== null}
          onOpenChange={(o) => {
            if (!o) setEditingId(null);
          }}
          user={editing}
          brainrots={brainrots}
          mutations={mutations}
        />
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div className="text-sm font-medium text-foreground">No brainrots yet.</div>
      <p className="mt-1 text-sm text-muted-foreground">
        Hit Add to drop your first one in.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: still errors in `components/DashboardClient.tsx` (will be fixed in Task 14).

- [ ] **Step 3: Stage**

```bash
rtk git add components/sections/BaseSection.tsx
```

(Single commit will happen at the end of Task 14.)

---

## Task 14 — `TradeSection` + new `DashboardClient` (tab switcher) + `app/page.tsx`

**Files:**
- Create: `components/sections/TradeSection.tsx`
- Rewrite: `components/DashboardClient.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create `components/sections/TradeSection.tsx`**

```tsx
'use client';

import { useState, useMemo } from 'react';
import { AddBrainrotDialog } from '@/components/dialogs/AddBrainrotDialog';
import { TradeCard } from '@/components/brainrot/TradeCard';
import { TradeStatsHeader } from '@/components/trade/TradeStatsHeader';
import { TradeHistoryLog } from '@/components/trade/TradeHistoryLog';
import {
  TradeHistoryProvider,
  useTradeHistory,
} from '@/components/trade/TradeHistoryProvider';
import {
  addToTradeAction,
  removeOneFromTradeAction,
} from '@/app/trade/actions';
import { cn } from '@/lib/utils';
import type { Brainrot, Mutation, TradeLogEvent, UserBrainrot } from '@/shared/types';

type Props = {
  trade: UserBrainrot[];
  tradeLog: TradeLogEvent[];
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

export function TradeSection(props: Props) {
  return (
    <TradeHistoryProvider>
      <TradeSectionInner {...props} />
    </TradeHistoryProvider>
  );
}

function TradeSectionInner({ trade, tradeLog, brainrots, mutations }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const { canUndo, canRedo, undo, redo, recordMutation } = useTradeHistory();

  const groups = useMemo(() => {
    const map = new Map<string, { brainrot: Brainrot; mutation: Mutation | null; count: number }>();
    for (const entry of trade) {
      const brainrot = brainrots.find((b) => b.id === entry.brainrot_id);
      if (!brainrot) continue;
      const mutation = entry.mutation_id != null
        ? mutations.find((m) => m.id === entry.mutation_id) ?? null
        : null;
      const key = `${entry.brainrot_id}:${entry.mutation_id ?? 'null'}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { brainrot, mutation, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [trade, brainrots, mutations]);

  async function handleIncrement(brainrot_id: number, mutation_id: number | null) {
    const result = await addToTradeAction(brainrot_id, mutation_id);
    if (result.ok) recordMutation({ trade: result.previousTrade, log: result.previousLog });
  }

  async function handleDecrement(brainrot_id: number, mutation_id: number | null) {
    const result = await removeOneFromTradeAction(brainrot_id, mutation_id);
    if (result.ok) recordMutation({ trade: result.previousTrade, log: result.previousLog });
  }

  return (
    <div className="space-y-12">
      <TradeStatsHeader entries={trade} brainrots={brainrots} mutations={mutations} />

      <section>
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Your trade</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Undo trade"
              title="Undo (trade)"
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-md border border-border bg-card transition-colors',
                canUndo
                  ? 'text-foreground hover:bg-accent'
                  : 'cursor-not-allowed text-muted-foreground/40',
              )}
            >
              ←
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              aria-label="Redo trade"
              title="Redo (trade)"
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-md border border-border bg-card transition-colors',
                canRedo
                  ? 'text-foreground hover:bg-accent'
                  : 'cursor-not-allowed text-muted-foreground/40',
              )}
            >
              →
            </button>
            <AddBrainrotDialog
              section="trade"
              brainrots={brainrots}
              mutations={mutations}
              currentEntries={trade}
              open={addOpen}
              onOpenChange={setAddOpen}
              onMutatedTrade={(prevTrade, prevLog) =>
                recordMutation({ trade: prevTrade, log: prevLog })
              }
            />
          </div>
        </header>

        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <div className="text-sm font-medium text-foreground">No brainrots in trade yet.</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Hit Add to start stocking up.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <TradeCard
                key={`${g.brainrot.id}:${g.mutation?.id ?? 'null'}`}
                brainrot={g.brainrot}
                mutation={g.mutation}
                count={g.count}
                onIncrement={() => handleIncrement(g.brainrot.id, g.mutation?.id ?? null)}
                onDecrement={() => handleDecrement(g.brainrot.id, g.mutation?.id ?? null)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Transactions
        </h3>
        <TradeHistoryLog events={tradeLog} brainrots={brainrots} />
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `components/DashboardClient.tsx`** as a tab switcher :

```tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BaseSection } from '@/components/sections/BaseSection';
import { TradeSection } from '@/components/sections/TradeSection';
import type { Brainrot, Mutation, TradeLogEvent, UserBrainrot } from '@/shared/types';

type Props = {
  base: UserBrainrot[];
  trade: UserBrainrot[];
  tradeLog: TradeLogEvent[];
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

type Section = 'base' | 'trade';

export function DashboardClient({ base, trade, tradeLog, brainrots, mutations }: Props) {
  const [section, setSection] = useState<Section>('base');

  return (
    <div className="space-y-8">
      <nav
        role="tablist"
        aria-label="Sections"
        className="inline-flex rounded-lg border border-border bg-card p-1"
      >
        <TabButton active={section === 'base'} onClick={() => setSection('base')}>
          Base
        </TabButton>
        <TabButton active={section === 'trade'} onClick={() => setSection('trade')}>
          Trade
        </TabButton>
      </nav>

      {section === 'base' ? (
        <BaseSection base={base} brainrots={brainrots} mutations={mutations} />
      ) : (
        <TradeSection
          trade={trade}
          tradeLog={tradeLog}
          brainrots={brainrots}
          mutations={mutations}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Update `app/page.tsx`**

```tsx
import { getBase } from '@/server/services/base';
import { getTrade } from '@/server/services/trade';
import { getTradeLog } from '@/server/services/trade-log';
import { brainrots } from '@/shared/data/brainrots';
import { mutations } from '@/shared/data/mutations';
import { DashboardClient } from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [base, trade, tradeLog] = await Promise.all([
    getBase(),
    getTrade(),
    getTradeLog(),
  ]);

  return (
    <DashboardClient
      base={base}
      trade={trade}
      tradeLog={tradeLog}
      brainrots={brainrots}
      mutations={mutations}
    />
  );
}
```

Note: the `StatsHeader` no longer renders at the top of the page — it's now embedded in `BaseSection`. The `totalIncome` import is dropped from `app/page.tsx`.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Run all tests**

Run: `rtk pnpm vitest run`
Expected: all green (existing tests still pass, new ones still pass).

- [ ] **Step 6: Commit all the staged UI work together**

```bash
rtk git add app/page.tsx components/DashboardClient.tsx components/sections/TradeSection.tsx
rtk git commit -m "feat(trade): Trade section with grouped cards, ± controls, history log, and Base/Trade tab switcher"
```

---

## Task 15 — Manual smoke + final verification

**Files:** (no code changes; verification only)

- [ ] **Step 1: Run lint**

Run: `rtk pnpm lint`
Expected: no errors.

- [ ] **Step 2: Run full test suite**

Run: `rtk pnpm test`
Expected: all green.

- [ ] **Step 3: Run build**

Run: `rtk pnpm build`
Expected: build succeeds, no type errors.

- [ ] **Step 4: Update decisions log**

Append to `docs/decisions.md`:

```markdown
## 2026-05-16 — Simon (Trade section)
- Ajout d'une section Trade en parallèle de Base, avec switcher de tabs sur la même page.
- Trade : pas de cap, niveau implicite 1, cartes groupées par (brainrot, mutation) avec compteur ± inline.
- Le dialog d'ajout devient section-aware avec footer `[− N +]` (remplace le bouton Add).
- Journal de transactions persisté en KV (`kicktrack:trade:log`), affiché chat-style avec merging visuel par fenêtres de 5min, couleurs +/− vert/rouge.
- Undo/redo Trade séparé (flèches dans la toolbar du tab Trade) ; Ctrl+Z reste dédié à Base.
- Spec : `docs/superpowers/specs/2026-05-16-trade-section-design.md`. Plan : `docs/superpowers/plans/2026-05-16-trade-section.md`.
```

- [ ] **Step 5: Commit verification + docs update**

```bash
rtk git add docs/decisions.md
rtk git commit -m "docs: update decisions log for Trade section ship"
```

- [ ] **Step 6: Manual smoke (only if dev server is running locally)**

If `pnpm dev` is available:
1. Open `/`.
2. Click "Trade" tab — empty state visible.
3. Open Add dialog. Pick a brainrot + gold mutation. Press `+` twice. Card appears with `×2`. Press `+` again. Card now `×3`. Close dialog.
4. Click `−` on the Trade card. Card becomes `×2`.
5. Verify the History log shows: `+3 <name> gold` then `-1 <name> gold` (or merged appropriately depending on timing).
6. Click the ← arrow (trade undo). Card should be back to `×3` and the `-1` entry should vanish from the log.
7. Switch to Base tab. Verify existing base content is intact and Ctrl+Z still operates on base only.
8. Refresh. Trade content + log persisted.

Note: in this worktree `pnpm dev` may not run because `node_modules` aren't installed. Defer manual smoke to the main checkout if needed.

---

## Self-review

**Spec coverage check :**
- Two KV keys (`kicktrack:trade`, `kicktrack:trade:log`) → Tasks 2-4. ✓
- `TradeLogEvent` type → Task 1. ✓
- New `server/services/trade.ts` + `server/services/trade-log.ts` → Tasks 3, 4. ✓
- `removeOneByComboFromBase` → Task 5. ✓
- Server actions → Task 7. ✓
- `mergeTradeLog` 5-min algorithm → Task 6. ✓
- `TradeHistoryProvider` (independent) → Task 8. ✓
- `TradeCard` (name, mutation chip, base × mutation, max-lvl-75, count, ±) → Task 9. ✓
- `TradeHistoryLog` chat-style with + green / − red → Task 10. ✓
- `TradeStatsHeader` (max total + count) → Task 11. ✓
- `AddBrainrotDialog`/`Form` section-aware with `[− N +]` → Task 12. ✓
- `BaseSection` + `TradeSection` + `DashboardClient` tab switcher + `app/page.tsx` → Tasks 13-14. ✓
- Verification → Task 15. ✓

**Placeholder scan :** No "TBD", no "implement later", no "similar to Task N", every code step has full code.

**Type consistency :**
- `addToTrade(brainrot_id, mutation_id)` → returns `{ entry, event }`. Used by `addToTradeAction` which exposes `{ ok, previousTrade, previousLog }`. ✓
- `removeOneByComboFromTrade(brainrot_id, mutation_id)` → returns `{ removedId, event } | null`. Used by `removeOneFromTradeAction` returning `{ ok, previousTrade, previousLog }`. ✓
- `recordMutation` signature in TradeHistoryProvider: `(snapshot: { trade, log }) => void`. Callers in `TradeSection` and `AddBrainrotForm` (via `onMutatedTrade`) match. ✓
- `useHistory` (base) unchanged. ✓
