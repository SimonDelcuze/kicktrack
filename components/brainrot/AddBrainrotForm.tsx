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
        toast.error('Base is full — this brainrot is weaker than your weakest.', {
          description: `${formatNumber(result.newcomerIncome)}/s vs ${formatNumber(result.worstIncome)}/s`,
        });
      }
    } finally {
      setPending(false);
    }
  }

  const sorted = [...brainrots].sort((a, b) => a.base_money_per_sec - b.base_money_per_sec);

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="brainrot_id" value={brainrotId ?? ''} />
      <input type="hidden" name="mutation_id" value={mutationId ?? 'null'} />
      <input type="hidden" name="level" value="1" />

      {/* Brainrot grid — no headers */}
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

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={brainrotId === null || pending}>
          {pending ? 'Adding…' : 'Add'}
        </Button>
      </div>
    </form>
  );
}
