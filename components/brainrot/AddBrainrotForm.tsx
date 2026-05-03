'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Brainrot, Mutation } from '@/shared/types';
import { createBrainrotAction } from '@/app/add/actions';
import { formatNumber } from '@/shared/utils/format';
import { MutationChip } from '@/components/brainrot/MutationChip';

type Props = {
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
  onComplete?: () => void;
};

export function AddBrainrotForm({ brainrots, mutations, onComplete }: Props) {
  const [brainrotId, setBrainrotId] = useState<number | null>(null);
  const [mutationId, setMutationId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  const selectedBrainrot = brainrots.find((b) => b.id === brainrotId) ?? null;
  const selectedMutation = mutations.find((m) => m.id === mutationId) ?? null;

  const previewIncome = selectedBrainrot
    ? selectedBrainrot.base_money_per_sec * (selectedMutation?.multiplier ?? 1)
    : null;

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await createBrainrotAction(formData);
      setBrainrotId(null);
      setMutationId(null);
      onComplete?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-14">
      <input type="hidden" name="brainrot_id" value={brainrotId ?? ''} />
      <input type="hidden" name="mutation_id" value={mutationId ?? 'null'} />
      <input type="hidden" name="level" value="1" />

      {/* ---------- Brainrot grid ---------- */}
      <section>
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Step 01
            </div>
            <h2 className="mt-1 font-serif text-3xl italic leading-tight md:text-4xl">
              Pick the brainrot
            </h2>
          </div>
          <div className="hidden font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground sm:block">
            {brainrots.length} entries
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
                  'group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200',
                  'min-h-[140px]',
                  isSelected
                    ? 'border-primary bg-primary/[0.06] shadow-[0_0_0_1px_var(--primary),0_8px_30px_-12px_oklch(0.84_0.16_85_/_40%)]'
                    : 'border-border bg-card/30 hover:border-foreground/30 hover:bg-card/60',
                )}
              >
                {isSelected && (
                  <span
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                    aria-hidden
                  />
                )}
                <div
                  className={cn(
                    'font-serif text-base leading-snug transition-colors',
                    isSelected ? 'text-foreground' : 'text-foreground/90',
                  )}
                >
                  {b.name}
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    base / s
                  </span>
                  <span
                    className={cn(
                      'font-mono text-sm tabular-nums transition-colors',
                      isSelected ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {formatNumber(b.base_money_per_sec)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- Mutations ---------- */}
      <section>
        <header className="mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Step 02
          </div>
          <h2 className="mt-1 font-serif text-3xl italic leading-tight md:text-4xl">
            Mutation <span className="text-muted-foreground">— optional</span>
          </h2>
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

      {/* ---------- Preview & submit ---------- */}
      <section className="border-t border-border/60 pt-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Preview at level 1
            </div>
            {previewIncome !== null ? (
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-5xl italic tracking-tight md:text-6xl">
                  {formatNumber(previewIncome)}
                </span>
                <span className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">
                  / s
                </span>
              </div>
            ) : (
              <div className="font-serif text-3xl italic text-muted-foreground/60 md:text-4xl">
                pick a brainrot —
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={brainrotId === null || pending}
            size="lg"
            className="font-mono uppercase tracking-[0.18em]"
          >
            {pending ? 'Adding…' : 'Add to base'}
          </Button>
        </div>
      </section>
    </form>
  );
}
