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
    <div className="space-y-8">
      <form action={handleUpdate} className="space-y-8">
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
                  'flex flex-col items-start gap-2 rounded-2xl border bg-card/40 p-4 text-left transition-all duration-150',
                  'hover:bg-card/70 hover:border-foreground/30',
                  isSelected
                    ? 'border-primary bg-primary/[0.08] ring-2 ring-primary/40'
                    : 'border-border/60',
                )}
              >
                <span className="text-[13px] font-medium leading-tight text-foreground">
                  {b.name}
                </span>
                <span
                  className={cn(
                    'font-mono text-base tabular-nums leading-none',
                    isSelected ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
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
              'rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-all',
              mutationId === null
                ? 'border-foreground bg-foreground text-background'
                : 'border-border/70 bg-card/40 text-muted-foreground hover:text-foreground',
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
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card/40 p-5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Level
            </span>
            <span className="font-mono text-2xl tabular-nums">
              {level}
              <span className="ml-1 text-xs text-muted-foreground">/ {MAX_LEVEL}</span>
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={MAX_LEVEL}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
          />
          {previewIncome !== null && (
            <div className="flex items-baseline justify-between border-t border-border/40 pt-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Income
              </span>
              <span className="font-mono text-2xl tabular-nums text-primary">
                {formatNumber(previewIncome)}
                <span className="ml-0.5 text-xs">/s</span>
              </span>
            </div>
          )}
        </div>

        {/* Save / delete actions */}
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-6">
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={handleDelete}
            className="font-mono uppercase tracking-[0.18em] text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Delete
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="font-mono uppercase tracking-[0.18em]"
          >
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}
