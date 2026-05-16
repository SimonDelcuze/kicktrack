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
