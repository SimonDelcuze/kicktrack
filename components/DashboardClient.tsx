'use client';

import { useState } from 'react';
import { BrainrotCard } from '@/components/brainrot/BrainrotCard';
import { AddBrainrotDialog } from '@/components/dialogs/AddBrainrotDialog';
import { EditBrainrotDialog } from '@/components/dialogs/EditBrainrotDialog';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';

type Props = {
  base: UserBrainrot[];
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

export function DashboardClient({ base, brainrots, mutations }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = editingId ? base.find((b) => b.id === editingId) ?? null : null;

  return (
    <section>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Your base
          </div>
          <h2 className="mt-1 font-serif text-3xl italic md:text-4xl">
            {base.length === 0 ? 'Empty for now —' : 'In rotation'}
          </h2>
        </div>
        <AddBrainrotDialog brainrots={brainrots} mutations={mutations} />
      </header>

      {base.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {base.map((user) => {
            const brainrot = brainrots.find((b) => b.id === user.brainrot_id);
            if (!brainrot) return null;
            const mutation =
              user.mutation_id != null
                ? mutations.find((m) => m.id === user.mutation_id) ?? null
                : null;
            return (
              <BrainrotCard
                key={user.id}
                user={user}
                brainrot={brainrot}
                mutation={mutation}
                onClick={() => setEditingId(user.id)}
              />
            );
          })}
        </div>
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
