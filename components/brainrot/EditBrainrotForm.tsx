'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';
import { updateBrainrotAction, deleteBrainrotAction } from '@/app/brainrot/[id]/actions';
import { formatNumber } from '@/shared/utils/format';
import { currentMoneyPerSec, MAX_LEVEL } from '@/shared/utils/calculations';
import { MutationChip } from '@/components/brainrot/MutationChip';

type Props = {
  user: UserBrainrot;
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
  onComplete?: () => void;
};

export function EditBrainrotForm({ user, brainrots, mutations, onComplete }: Props) {
  const [brainrotId, setBrainrotId] = useState<number>(user.brainrot_id);
  const [mutationId, setMutationId] = useState<number | null>(user.mutation_id);
  const [level, setLevel] = useState<number>(user.level);
  const [pending, setPending] = useState(false);

  const selectedBrainrot = brainrots.find((b) => b.id === brainrotId) ?? null;
  const selectedMutation = mutations.find((m) => m.id === mutationId) ?? null;

  const previewIncome =
    selectedBrainrot && level >= 1 && level <= MAX_LEVEL
      ? currentMoneyPerSec(selectedBrainrot, level, selectedMutation)
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

  const sorted = [...brainrots].sort((a, b) => a.base_money_per_sec - b.base_money_per_sec);

  return (
    <form action={handleUpdate} className="space-y-6">
      <input type="hidden" name="brainrot_id" value={brainrotId} />
      <input type="hidden" name="mutation_id" value={mutationId ?? 'null'} />
      <input type="hidden" name="level" value={level} />

      {/* Brainrot grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {sorted.map((b) => {
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

      {/* Mutation chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMutationId(null)}
          className={cn(
            'rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors',
            mutationId === null
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-card text-muted-foreground hover:text-foreground',
          )}
        >
          none
        </button>
        {mutations.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMutationId(m.id)}
            className="rounded-full"
            aria-pressed={mutationId === m.id}
          >
            <MutationChip mutation={m} selected={mutationId === m.id} variant="chip" />
          </button>
        ))}
      </div>

      {/* Level slider + income preview */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Level
          </span>
          <span className="font-mono text-2xl font-semibold tabular-nums">
            {level}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              / {MAX_LEVEL}
            </span>
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={MAX_LEVEL}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-foreground"
        />
        {previewIncome !== null && (
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Income
            </span>
            <span className="font-mono text-2xl font-semibold tabular-nums">
              {formatNumber(previewIncome)}
              <span className="ml-0.5 text-xs font-normal text-muted-foreground">/s</span>
            </span>
          </div>
        )}
      </div>

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
