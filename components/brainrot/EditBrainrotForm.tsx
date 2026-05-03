'use client';

import { useState } from 'react';
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

  async function handleUpdate(formData: FormData) {
    setPending(true);
    try {
      await updateBrainrotAction(user.id, formData);
      onComplete?.();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setPending(true);
    try {
      await deleteBrainrotAction(user.id);
      onComplete?.();
    } finally {
      setPending(false);
    }
  }

  const selectedBrainrot = brainrots.find((b) => b.id === brainrotId) ?? null;
  const selectedMutation = mutations.find((m) => m.id === mutationId) ?? null;

  const previewIncome =
    selectedBrainrot && level >= 1 && level <= MAX_LEVEL
      ? currentMoneyPerSec(selectedBrainrot, level, selectedMutation)
      : null;

  return (
    <div className="space-y-12">
      <form action={handleUpdate} className="space-y-12">
        <input type="hidden" name="brainrot_id" value={brainrotId} />
        <input type="hidden" name="mutation_id" value={mutationId ?? 'null'} />
        <input type="hidden" name="level" value={level} />

        {/* Brainrot picker */}
        <section>
          <header className="mb-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Brainrot
            </div>
          </header>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {brainrots.map((b) => {
              const isSelected = brainrotId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBrainrotId(b.id)}
                  className={cn(
                    'group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 min-h-[120px]',
                    isSelected
                      ? 'border-primary bg-primary/[0.06] shadow-[0_0_0_1px_var(--primary)]'
                      : 'border-border bg-card/30 hover:border-foreground/30 hover:bg-card/60',
                  )}
                >
                  <div className="font-serif text-base leading-snug">{b.name}</div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      base/s
                    </span>
                    <span className={cn('font-mono text-sm tabular-nums', isSelected ? 'text-primary' : '')}>
                      {formatNumber(b.base_money_per_sec)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Mutation picker */}
        <section>
          <header className="mb-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Mutation
            </div>
          </header>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMutationId(null)}
              className={cn(
                'rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-all',
                mutationId === null
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card/30 text-muted-foreground hover:text-foreground',
              )}
            >
              none
            </button>
            {mutations.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMutationId(m.id)}
                className="rounded-full transition-transform"
                aria-pressed={mutationId === m.id}
              >
                <MutationChip mutation={m} selected={mutationId === m.id} variant="chip" />
              </button>
            ))}
          </div>
        </section>

        {/* Level slider */}
        <section>
          <header className="mb-4 flex items-end justify-between">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Level
              </div>
            </div>
            <div className="font-serif text-3xl italic leading-none tabular-nums">
              {level}
              <span className="ml-1 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                / {MAX_LEVEL}
              </span>
            </div>
          </header>
          <input
            type="range"
            min={1}
            max={MAX_LEVEL}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
          />
        </section>

        {/* Preview + actions */}
        <section className="border-t border-border/60 pt-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Income preview
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-serif text-5xl italic leading-none md:text-6xl">
                  {previewIncome !== null ? formatNumber(previewIncome) : '—'}
                </span>
                <span className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">
                  / s
                </span>
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="font-mono uppercase tracking-[0.18em]"
            >
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </section>
      </form>

      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-destructive">
              Danger zone
            </div>
            <div className="mt-1 font-serif text-lg italic">
              Remove this brainrot from your base.
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
            className="font-mono uppercase tracking-[0.18em]"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
