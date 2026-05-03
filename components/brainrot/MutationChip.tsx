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
      ? 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em]'
      : 'inline-flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium uppercase tracking-[0.14em]';

  const style = isRainbow
    ? undefined
    : ({
        backgroundColor: mutation.color_hex,
        color: light ? '#fafafa' : '#0a0a0a',
        boxShadow: selected
          ? `0 0 0 2px var(--background), 0 0 0 4px ${mutation.color_hex}`
          : undefined,
      } as React.CSSProperties);

  return (
    <span
      className={cn(
        base,
        isRainbow && 'bg-rainbow text-black',
        isRainbow && selected && 'ring-4 ring-offset-2 ring-offset-background ring-white/80',
        'transition-transform duration-200',
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
