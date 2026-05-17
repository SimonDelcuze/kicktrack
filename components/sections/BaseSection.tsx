'use client';

import { useState, useMemo } from 'react';
import { BrainrotCard } from '@/components/brainrot/BrainrotCard';
import { AddBrainrotDialog } from '@/components/dialogs/AddBrainrotDialog';
import { EditBrainrotDialog } from '@/components/dialogs/EditBrainrotDialog';
import { StatsHeader } from '@/components/stats/StatsHeader';
import { currentMoneyPerSec, totalIncome, compareMutationTier } from '@/shared/utils/calculations';
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
      .sort(
        (a, b) => b.income - a.income || compareMutationTier(a.mutation, b.mutation),
      );
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
            onAddedToBase={(id) => setRecentlyAddedIds((prev) => [...prev, id])}
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
