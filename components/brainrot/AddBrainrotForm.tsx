'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Brainrot, Mutation } from '@/shared/types';
import { createBrainrotAction } from '@/app/add/actions';
import { formatNumber } from '@/shared/utils/format';
import { RAINBOW_MUTATION_ID } from '@/shared/data/mutations';
import { needsLightText } from '@/shared/utils/contrast';

type Props = {
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
  onAdded?: (id: string) => void;
};

export function AddBrainrotForm({ brainrots, mutations, onAdded }: Props) {
  const [brainrotId, setBrainrotId] = useState<number | null>(null);
  const [mutationId, setMutationId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [search, setSearch] = useState('');

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await createBrainrotAction(formData);
      if (result.ok) {
        setBrainrotId(null);
        setMutationId(null);
        setSearch('');
        toast.success('Added to base.');
        onAdded?.(result.entry.id);
        // Dialog stays open — user can chain more adds.
      } else if (result.error === 'base_full_too_weak') {
        toast.error('Base is full — this brainrot is weaker than your weakest.', {
          description: `${formatNumber(result.newcomerIncome)}/s vs ${formatNumber(result.worstIncome)}/s`,
        });
      }
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
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="brainrot_id" value={brainrotId ?? ''} />
      <input type="hidden" name="mutation_id" value={mutationId ?? 'null'} />
      <input type="hidden" name="level" value="1" />

      <Input
        type="search"
        placeholder="Search brainrots…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-10"
      />

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

      {/* Mutation cards (matching brainrot card style) */}
      <MutationGrid mutations={mutations} selectedId={mutationId} onSelect={setMutationId} />

      <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={brainrotId === null || pending}>
          {pending ? 'Adding…' : 'Add'}
        </Button>
      </div>
    </form>
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
      {/* None card */}
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

  // Variants:
  // - none: white card, dark text
  // - colored: colored bg, white/dark text based on contrast
  // - rainbow: gradient bg, dark text
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
