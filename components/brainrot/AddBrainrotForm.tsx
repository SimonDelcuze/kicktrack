'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';
import {
  createBrainrotAction,
  removeOneByComboFromBaseAction,
} from '@/app/add/actions';
import {
  addToTradeAction,
  removeOneFromTradeAction,
} from '@/app/trade/actions';
import { formatNumber } from '@/shared/utils/format';
import { RAINBOW_MUTATION_ID } from '@/shared/data/mutations';
import { needsLightText } from '@/shared/utils/contrast';

type Section = 'base' | 'trade';

type Props = {
  section: Section;
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
  currentEntries: readonly UserBrainrot[];
  onMutatedBase?: (previousBase: UserBrainrot[]) => void;
  onMutatedTrade?: (previousTrade: UserBrainrot[], previousLog: import('@/shared/types').TradeLogEvent[]) => void;
  onEnqueueTradeAdd?: (brainrot_id: number, mutation_id: number | null) => void;
  onEnqueueTradeRemove?: (brainrot_id: number, mutation_id: number | null) => void;
};

export function AddBrainrotForm({
  section,
  brainrots,
  mutations,
  currentEntries,
  onMutatedBase,
  onMutatedTrade,
  onEnqueueTradeAdd,
  onEnqueueTradeRemove,
}: Props) {
  const [brainrotId, setBrainrotId] = useState<number | null>(null);
  const [mutationId, setMutationId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...brainrots].sort((a, b) => a.base_money_per_sec - b.base_money_per_sec);
    if (!q) return sorted;
    return sorted.filter((b) => b.name.toLowerCase().includes(q));
  }, [brainrots, search]);

  const count = useMemo(() => {
    if (brainrotId === null) return 0;
    return currentEntries.filter(
      (e) => e.brainrot_id === brainrotId && e.mutation_id === mutationId && e.level === 1,
    ).length;
  }, [currentEntries, brainrotId, mutationId]);

  async function handleIncrement() {
    if (brainrotId === null) return;
    setPending(true);
    try {
      if (section === 'base') {
        const formData = new FormData();
        formData.set('brainrot_id', String(brainrotId));
        formData.set('mutation_id', mutationId === null ? 'null' : String(mutationId));
        formData.set('level', '1');
        const result = await createBrainrotAction(formData);
        if (result.ok) {
          onMutatedBase?.(result.previousBase);
          toast.success('Added to base.');
        } else if (result.error === 'base_full_too_weak') {
          toast.error('Base is full — this brainrot is weaker than your weakest.', {
            description: `${formatNumber(result.newcomerIncome)}/s vs ${formatNumber(result.worstIncome)}/s`,
          });
        }
      } else {
        if (onEnqueueTradeAdd) {
          onEnqueueTradeAdd(brainrotId, mutationId);
          toast.success('Added to trade.');
        } else {
          const result = await addToTradeAction(brainrotId, mutationId);
          if (result.ok) {
            onMutatedTrade?.(result.previousTrade, result.previousLog);
            toast.success('Added to trade.');
          }
        }
      }
    } finally {
      setPending(false);
    }
  }

  async function handleDecrement() {
    if (brainrotId === null || count === 0) return;
    setPending(true);
    try {
      if (section === 'base') {
        const result = await removeOneByComboFromBaseAction(brainrotId, mutationId, 1);
        if (result.ok) {
          onMutatedBase?.(result.previousBase);
          toast.success('Removed from base.');
        }
      } else {
        if (onEnqueueTradeRemove) {
          onEnqueueTradeRemove(brainrotId, mutationId);
          toast.success('Removed from trade.');
        } else {
          const result = await removeOneFromTradeAction(brainrotId, mutationId);
          if (result.ok) {
            onMutatedTrade?.(result.previousTrade, result.previousLog);
            toast.success('Removed from trade.');
          }
        }
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Input
        type="search"
        placeholder="Search brainrots…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-10"
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          No brainrot matches &ldquo;{search}&rdquo;.
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

      <MutationGrid mutations={mutations} selectedId={mutationId} onSelect={setMutationId} />

      <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={brainrotId === null || pending || count === 0}
            aria-label="Remove one"
            className={cn(
              'h-11 w-14 rounded-md border border-border bg-card font-mono text-lg font-semibold',
              'hover:border-foreground/40',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            −
          </button>
          <span className="flex h-11 min-w-[3rem] items-center justify-center font-mono text-lg font-semibold tabular-nums">
            {count}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={brainrotId === null || pending}
            aria-label="Add one"
            className={cn(
              'h-11 w-14 rounded-md border border-foreground bg-foreground font-mono text-lg font-semibold text-background',
              'hover:opacity-90',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

type MutationGridProps = {
  mutations: readonly Mutation[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
};

export function MutationGrid({ mutations, selectedId, onSelect }: MutationGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      <MutationCardButton
        label="None"
        multiplier="×1"
        selected={selectedId === null}
        onClick={() => onSelect(null)}
      />
      {mutations.map((m) => (
        <MutationCardButton
          key={m.id}
          label={m.name}
          multiplier={`×${m.multiplier}`}
          color={m.color_hex}
          isRainbow={m.id === RAINBOW_MUTATION_ID}
          selected={selectedId === m.id}
          onClick={() => onSelect(m.id)}
        />
      ))}
    </div>
  );
}

type CardButtonProps = {
  label: string;
  multiplier: string;
  color?: string;
  isRainbow?: boolean;
  selected: boolean;
  onClick: () => void;
};

function MutationCardButton({
  label,
  multiplier,
  color,
  isRainbow,
  selected,
  onClick,
}: CardButtonProps) {
  const colored = !!color && !isRainbow;
  const light = colored && needsLightText(color);

  const baseClass =
    'flex flex-col items-start justify-between gap-2 rounded-xl border p-3 text-left transition-all min-h-[88px]';
  const stateClass = selected
    ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
    : 'hover:scale-[1.01]';

  let variantClass: string;
  let style: React.CSSProperties | undefined;
  if (isRainbow) {
    variantClass = 'bg-rainbow text-black border-black/10';
  } else if (colored) {
    variantClass = 'border-black/10';
    style = {
      backgroundColor: color,
      color: light ? '#fafafa' : '#0a0a0a',
    };
  } else {
    variantClass = 'border-border bg-card text-foreground';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(baseClass, variantClass, stateClass)}
      style={style}
      aria-pressed={selected}
    >
      <span className="text-[13px] font-bold uppercase tracking-wide leading-none">
        {label}
      </span>
      <span className="font-mono text-base font-semibold tabular-nums">{multiplier}</span>
    </button>
  );
}
