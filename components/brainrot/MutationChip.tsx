import { cn } from '@/lib/utils';
import { RAINBOW_MUTATION_ID } from '@/shared/data/mutations';
import type { Mutation } from '@/shared/types';
import { needsLightText } from '@/shared/utils/contrast';

type Variant = 'chip' | 'pill';

type Props = {
  mutation: Mutation;
  selected?: boolean;
  variant?: Variant;
  className?: string;
  showMultiplier?: boolean;
};

export function MutationChip({
  mutation,
  selected = false,
  variant = 'chip',
  className,
  showMultiplier = true,
}: Props) {
  const isRainbow = mutation.id === RAINBOW_MUTATION_ID;
  const light = needsLightText(mutation.color_hex);

  const base =
    variant === 'chip'
      ? 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide'
      : 'inline-flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium uppercase tracking-wide';

  const style = isRainbow
    ? undefined
    : ({
        backgroundColor: mutation.color_hex,
        color: light ? '#fafafa' : '#0a0a0a',
        boxShadow: selected
          ? `0 0 0 2px var(--background), 0 0 0 4px ${mutation.color_hex}`
          : 'inset 0 0 0 1px rgba(0,0,0,0.08)',
      } as React.CSSProperties);

  return (
    <span
      className={cn(
        base,
        isRainbow && 'bg-rainbow text-black ring-1 ring-black/10',
        isRainbow && selected && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
        'transition-transform duration-150',
        selected && 'scale-[1.03]',
        className,
      )}
      style={style}
    >
      <span>{mutation.name}</span>
      {showMultiplier && <span className="font-mono opacity-80">×{mutation.multiplier}</span>}
    </span>
  );
}
