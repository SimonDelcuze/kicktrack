'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MutationChip } from '@/components/brainrot/MutationChip';
import { cn } from '@/lib/utils';
import { MAX_LEVEL, currentMoneyPerSec } from '@/shared/utils/calculations';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';

type Props = {
  trade: UserBrainrot[];
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
  onEnqueueRemove: (brainrot_id: number, mutation_id: number | null) => void;
};

type Group = {
  brainrot: Brainrot;
  mutation: Mutation | null;
  count: number;
  income: number;
  key: string;
};

export function BulkRemoveDialog({
  trade,
  brainrots,
  mutations,
  onEnqueueRemove,
}: Props) {
  const [open, setOpen] = useState(false);
  const [toRemove, setToRemove] = useState<Map<string, number>>(new Map());

  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Group>();
    for (const entry of trade) {
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
        map.set(key, {
          brainrot,
          mutation,
          count: 1,
          income: currentMoneyPerSec(brainrot, MAX_LEVEL, mutation),
          key,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.income - a.income);
  }, [trade, brainrots, mutations]);

  function handleOpen(next: boolean) {
    if (next) setToRemove(new Map()); // reset every time the dialog opens
    setOpen(next);
  }

  function setRemoveCount(key: string, value: number, max: number) {
    setToRemove((m) => {
      const next = new Map(m);
      const clamped = Math.max(0, Math.min(max, value));
      if (clamped === 0) next.delete(key);
      else next.set(key, clamped);
      return next;
    });
  }

  function selectAll() {
    setToRemove(new Map(groups.map((g) => [g.key, g.count])));
  }

  function clearAll() {
    setToRemove(new Map());
  }

  const totalToRemove = Array.from(toRemove.values()).reduce((s, n) => s + n, 0);
  const isEmpty = groups.length === 0;

  function handleConfirm() {
    for (const g of groups) {
      const n = toRemove.get(g.key) ?? 0;
      for (let i = 0; i < n; i++) {
        onEnqueueRemove(g.brainrot.id, g.mutation?.id ?? null);
      }
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" disabled={isEmpty && !open}>
            Bulk remove
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-6">
        <DialogTitle>Bulk remove from trade</DialogTitle>
        <DialogDescription className="sr-only">
          Choose how many of each combo to remove, then confirm.
        </DialogDescription>

        {isEmpty ? (
          <div className="mt-4 rounded-md border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
            Trade is empty.
          </div>
        ) : (
          <>
            <div className="mt-2 mb-3 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {groups.length} unique combo{groups.length === 1 ? '' : 's'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={selectAll}
                  className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                >
                  Select all
                </button>
              </div>
            </div>

            <ul className="flex flex-col gap-2">
              {groups.map((g) => {
                const removeCount = toRemove.get(g.key) ?? 0;
                return (
                  <li
                    key={g.key}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="truncate text-sm font-semibold">
                        {g.brainrot.name}
                      </span>
                      {g.mutation && <MutationChip mutation={g.mutation} variant="chip" />}
                      <span className="ml-auto font-mono text-xs text-muted-foreground">
                        ×{g.count}
                      </span>
                    </div>
                    <div className="flex items-stretch gap-2">
                      <button
                        type="button"
                        onClick={() => setRemoveCount(g.key, removeCount - 1, g.count)}
                        disabled={removeCount === 0}
                        aria-label="Decrement"
                        className={cn(
                          'h-9 w-10 rounded-md border border-border bg-card font-mono text-base font-semibold',
                          'hover:border-foreground/40',
                          'disabled:cursor-not-allowed disabled:opacity-40',
                        )}
                      >
                        −
                      </button>
                      <span className="flex h-9 min-w-[2.5rem] items-center justify-center font-mono text-base font-semibold tabular-nums">
                        {removeCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRemoveCount(g.key, removeCount + 1, g.count)}
                        disabled={removeCount >= g.count}
                        aria-label="Increment"
                        className={cn(
                          'h-9 w-10 rounded-md border border-border bg-card font-mono text-base font-semibold',
                          'hover:border-foreground/40',
                          'disabled:cursor-not-allowed disabled:opacity-40',
                        )}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemoveCount(g.key, g.count, g.count)}
                        disabled={removeCount === g.count}
                        className={cn(
                          'h-9 rounded-md border border-border bg-card px-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground',
                          'hover:border-foreground/40 hover:text-foreground',
                          'disabled:cursor-not-allowed disabled:opacity-40',
                        )}
                      >
                        max
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={totalToRemove === 0}
          >
            Remove {totalToRemove}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
