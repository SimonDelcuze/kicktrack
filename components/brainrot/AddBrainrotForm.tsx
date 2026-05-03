'use client';

import { useState } from 'react';
import { toast } from 'sonner';
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

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await createBrainrotAction(formData);
      if (result.ok) {
        setBrainrotId(null);
        setMutationId(null);
        toast.success('Added to base.');
        onComplete?.();
      } else if (result.error === 'base_full_too_weak') {
        toast.error('Base is full — this brainrot is weaker than your weakest. Won’t add.', {
          description: `${formatNumber(result.newcomerIncome)}/s vs ${formatNumber(result.worstIncome)}/s`,
        });
      }
    } finally {
      setPending(false);
    }
  }

  const sorted = [...brainrots].sort((a, b) => a.base_money_per_sec - b.base_money_per_sec);

  return (
    <form action={handleSubmit} className="space-y-8">
      <input type="hidden" name="brainrot_id" value={brainrotId ?? ''} />
      <input type="hidden" name="mutation_id" value={mutationId ?? 'null'} />
      <input type="hidden" name="level" value="1" />

      {/* Brainrot grid — no headers, no labels */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {sorted.map((b) => {
          const isSelected = brainrotId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setBrainrotId(b.id)}
              className={cn(
                'group flex flex-col items-start gap-2 rounded-2xl border bg-card/40 p-4 text-left transition-all duration-150',
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

      {/* Submit row */}
      <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-6">
        <Button
          type="submit"
          disabled={brainrotId === null || pending}
          size="lg"
          className="font-mono uppercase tracking-[0.18em]"
        >
          {pending ? 'Adding…' : 'Add'}
        </Button>
      </div>
    </form>
  );
}
