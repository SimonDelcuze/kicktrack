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
