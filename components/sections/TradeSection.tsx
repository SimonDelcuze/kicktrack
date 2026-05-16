'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { AddBrainrotDialog } from '@/components/dialogs/AddBrainrotDialog';
import { TradeCard } from '@/components/brainrot/TradeCard';
import { TradeHistoryLog } from '@/components/trade/TradeHistoryLog';
import {
  applyTradeBatchAction,
  setTradeAndLogAction,
  type TradeBatchOp,
} from '@/app/trade/actions';
import { MAX_LEVEL, currentMoneyPerSec } from '@/shared/utils/calculations';
import { cn } from '@/lib/utils';
import type { Brainrot, Mutation, TradeLogEvent, UserBrainrot } from '@/shared/types';

const FLUSH_INTERVAL_MS = 10_000;

type Props = {
  trade: UserBrainrot[];
  tradeLog: TradeLogEvent[];
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

type Snapshot = { trade: UserBrainrot[]; log: TradeLogEvent[] };

export function TradeSection({ trade, tradeLog, brainrots, mutations }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [queue, setQueue] = useState<TradeBatchOp[]>([]);
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const flushingRef = useRef(false);

  // Compute optimistic trade by applying queue to server state.
  const optimisticTrade = useMemo(() => {
    let next = [...trade];
    for (const op of queue) {
      if (op.kind === 'add') {
        // Append a synthetic entry; its concrete id doesn't matter for the UI
        // because cards are grouped by (brainrot_id, mutation_id).
        next.push({
          id: `optimistic-${op.brainrot_id}-${op.mutation_id ?? 'null'}-${next.length}`,
          brainrot_id: op.brainrot_id,
          mutation_id: op.mutation_id,
          level: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        // Remove the most-recently-added matching entry from the working copy.
        const idx = [...next]
          .map((e, i) => ({ e, i }))
          .reverse()
          .find(
            ({ e }) => e.brainrot_id === op.brainrot_id && e.mutation_id === op.mutation_id,
          );
        if (idx) next = next.filter((_, i) => i !== idx.i);
      }
    }
    return next;
  }, [trade, queue]);

  const groups = useMemo(() => {
    const map = new Map<string, { brainrot: Brainrot; mutation: Mutation | null; count: number }>();
    for (const entry of optimisticTrade) {
      const brainrot = brainrots.find((b) => b.id === entry.brainrot_id);
      if (!brainrot) continue;
      const mutation =
        entry.mutation_id != null
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
    return Array.from(map.values()).sort(
      (a, b) =>
        currentMoneyPerSec(b.brainrot, MAX_LEVEL, b.mutation) -
        currentMoneyPerSec(a.brainrot, MAX_LEVEL, a.mutation),
    );
  }, [optimisticTrade, brainrots, mutations]);

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    if (queue.length === 0) return;
    flushingRef.current = true;
    const batch = queue;
    setQueue([]);
    try {
      await applyTradeBatchAction(batch);
    } catch (e) {
      // Restore the batch to the front of the queue for retry.
      setQueue((q) => [...batch, ...q]);
      toast.error('Sync failed — will retry on next flush.');
      console.error(e);
    } finally {
      flushingRef.current = false;
    }
  }, [queue]);

  // Auto-flush every FLUSH_INTERVAL_MS.
  useEffect(() => {
    const id = setInterval(() => {
      flush();
    }, FLUSH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [flush]);

  // Flush on tab hide / page unload.
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'hidden') flush();
    }
    function onBeforeUnload() {
      flush();
    }
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [flush]);

  // Flush on unmount (e.g. switching to Base tab).
  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  function recordSnapshot() {
    // Snapshot the current optimistic trade so undo can restore it. The log we
    // store is the SERVER log — undo replaces the server, which drops any
    // unflushed events. Acceptable trade-off for snapshot consistency.
    setPast((p) => [...p, { trade: optimisticTrade, log: tradeLog }].slice(-50));
    setFuture([]);
  }

  function enqueueAdd(brainrot_id: number, mutation_id: number | null) {
    recordSnapshot();
    setQueue((q) => [...q, { kind: 'add', brainrot_id, mutation_id }]);
  }

  function enqueueRemove(brainrot_id: number, mutation_id: number | null) {
    recordSnapshot();
    setQueue((q) => [...q, { kind: 'remove', brainrot_id, mutation_id }]);
  }

  async function undo() {
    if (past.length === 0) return;
    const target = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [{ trade: optimisticTrade, log: tradeLog }, ...f].slice(0, 50));
    setQueue([]); // discard pending — undo snaps to the snapshot
    try {
      await setTradeAndLogAction(target.trade, target.log);
    } catch (e) {
      toast.error('Trade undo failed.');
      console.error(e);
    }
  }

  async function redo() {
    if (future.length === 0) return;
    const target = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, { trade: optimisticTrade, log: tradeLog }].slice(-50));
    setQueue([]);
    try {
      await setTradeAndLogAction(target.trade, target.log);
    } catch (e) {
      toast.error('Trade redo failed.');
      console.error(e);
    }
  }

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const pendingCount = queue.length;

  return (
    <div className="space-y-12">
      <section>
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Your trade</h2>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="font-mono text-xs text-muted-foreground" aria-live="polite">
                Saving {pendingCount}…
              </span>
            )}
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
              currentEntries={optimisticTrade}
              open={addOpen}
              onOpenChange={setAddOpen}
              onEnqueueTradeAdd={enqueueAdd}
              onEnqueueTradeRemove={enqueueRemove}
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
                onIncrement={() => enqueueAdd(g.brainrot.id, g.mutation?.id ?? null)}
                onDecrement={() => enqueueRemove(g.brainrot.id, g.mutation?.id ?? null)}
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
