'use client';

import { useState, useMemo } from 'react';
import { BrainrotCard } from '@/components/brainrot/BrainrotCard';
import { AddBrainrotDialog } from '@/components/dialogs/AddBrainrotDialog';
import { EditBrainrotDialog } from '@/components/dialogs/EditBrainrotDialog';
import { currentMoneyPerSec } from '@/shared/utils/calculations';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';

const MAX_BASE_SIZE = 30;

type Props = {
  base: UserBrainrot[];
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

export function DashboardClient({ base, brainrots, mutations }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = editingId ? base.find((b) => b.id === editingId) ?? null : null;

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

  return (
    <section>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Your base
          </h2>
          <span className="font-mono text-[11px] tabular-nums uppercase tracking-[0.22em] text-foreground">
            {base.length.toString().padStart(2, '0')}
            <span className="text-muted-foreground"> / {MAX_BASE_SIZE}</span>
          </span>
        </div>
        <AddBrainrotDialog brainrots={brainrots} mutations={mutations} />
      </header>

      {base.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {enriched.map((entry, idx) => (
            <BrainrotCard
              key={entry.user.id}
              user={entry.user}
              brainrot={entry.brainrot}
              mutation={entry.mutation}
              position={idx + 1}
              onClick={() => setEditingId(entry.user.id)}
            />
          ))}
        </div>
      )}

      {isFull && (
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
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
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border/80 bg-card/20 p-16 text-center">
      <div className="mx-auto max-w-sm space-y-3">
        <div className="font-serif text-2xl italic text-muted-foreground">
          No brainrots yet.
        </div>
        <p className="text-sm text-muted-foreground">
          Hit the <span className="font-mono uppercase tracking-[0.18em]">add</span> button to
          drop your first one in.
        </p>
      </div>
    </div>
  );
}
