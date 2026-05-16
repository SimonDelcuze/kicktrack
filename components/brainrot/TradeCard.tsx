'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/shared/utils/format';
import { MAX_LEVEL, currentMoneyPerSec } from '@/shared/utils/calculations';
import { MutationChip } from '@/components/brainrot/MutationChip';
import type { Brainrot, Mutation } from '@/shared/types';

type Props = {
  brainrot: Brainrot;
  mutation: Mutation | null;
  count: number;
  onIncrement: () => Promise<void> | void;
  onDecrement: () => Promise<void> | void;
};

export function TradeCard({ brainrot, mutation, count, onIncrement, onDecrement }: Props) {
  const [pending, setPending] = useState(false);
  const baseIncome = currentMoneyPerSec(brainrot, 1, mutation);
  const maxIncome = currentMoneyPerSec(brainrot, MAX_LEVEL, mutation);

  async function handle(op: () => Promise<void> | void) {
    setPending(true);
    try {
      await op();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left min-h-[160px]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold leading-tight text-foreground">
          {brainrot.name}
        </div>
        <span className="shrink-0 rounded-md bg-foreground/10 px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-foreground">
          ×{count}
        </span>
      </div>

      {mutation && <MutationChip mutation={mutation} variant="chip" />}

      <div className="font-mono text-xs tabular-nums text-muted-foreground">
        <div className="flex justify-between">
          <span>Base</span>
          <span>{formatNumber(baseIncome)}</span>
        </div>
        <div className="flex justify-between">
          <span>Max</span>
          <span>{formatNumber(maxIncome)}</span>
        </div>
      </div>

      <div className="mt-auto flex items-stretch justify-between gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => handle(onDecrement)}
          disabled={pending || count === 0}
          aria-label="Remove one"
          className={cn(
            'flex-1 rounded-md border border-border bg-card font-mono text-base font-semibold transition-colors',
            'hover:border-foreground/40',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          −
        </button>
        <span className="flex min-w-[2.5rem] items-center justify-center font-mono text-base font-semibold tabular-nums">
          {count}
        </span>
        <button
          type="button"
          onClick={() => handle(onIncrement)}
          disabled={pending}
          aria-label="Add one"
          className={cn(
            'flex-1 rounded-md border border-border bg-card font-mono text-base font-semibold transition-colors',
            'hover:border-foreground/40',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          +
        </button>
      </div>
    </div>
  );
}
