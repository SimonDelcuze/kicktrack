import { describe, it, expect } from 'vitest';
import { mergeTradeLog } from '@/shared/utils/trade-merge';
import type { TradeLogEvent } from '@/shared/types';

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
