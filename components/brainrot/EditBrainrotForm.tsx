'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';
import { updateBrainrotAction, deleteBrainrotAction } from '@/app/brainrot/[id]/actions';
import { formatNumber } from '@/shared/utils/format';
import { currentMoneyPerSec } from '@/shared/utils/calculations';
import { MutationGrid } from '@/components/brainrot/AddBrainrotForm';

type Props = {
  user: UserBrainrot;
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
  onComplete?: () => void;
};

export function EditBrainrotForm({ user, brainrots, mutations, onComplete }: Props) {
  const [brainrotId, setBrainrotId] = useState<number>(user.brainrot_id);
  const [mutationId, setMutationId] = useState<number | null>(user.mutation_id);
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState('');

  const selectedBrainrot = brainrots.find((b) => b.id === brainrotId) ?? null;
  const selectedMutation = mutations.find((m) => m.id === mutationId) ?? null;

  const previewIncome = selectedBrainrot
    ? currentMoneyPerSec(selectedBrainrot, 1, selectedMutation)
    : null;

  async function handleUpdate(formData: FormData) {
    setPending(true);
    try {
      await updateBrainrotAction(user.id, formData);
      toast.success('Saved.');
      onComplete?.();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setPending(true);
    try {
      await deleteBrainrotAction(user.id);
      toast.success('Removed.');
      onComplete?.();
    } finally {
      setPending(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...brainrots].sort((a, b) => a.base_money_per_sec - b.base_money_per_sec);
    if (!q) return sorted;
    return sorted.filter((b) => b.name.toLowerCase().includes(q));
  }, [brainrots, search]);

  return (
    <form action={handleUpdate} className="space-y-6">
      <input type="hidden" name="brainrot_id" value={brainrotId} />
      <input type="hidden" name="mutation_id" value={mutationId ?? 'null'} />
      <input type="hidden" name="level" value="1" />

      {/* Search */}
      <Input
        type="search"
        placeholder="Search brainrots…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-10"
      />

      {/* Brainrot grid */}
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

      {/* Mutation cards */}
      <MutationGrid mutations={mutations} selectedId={mutationId} onSelect={setMutationId} />

      {/* Income preview */}
      {previewIncome !== null && (
        <div className="flex items-baseline justify-between rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Income
          </span>
          <span className="font-mono text-2xl font-semibold tabular-nums">
            {formatNumber(previewIncome)}
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">/s</span>
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={handleDelete}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Delete
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
