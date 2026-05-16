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
