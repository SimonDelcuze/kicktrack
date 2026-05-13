import { cn } from '@/lib/utils';
import { formatNumber } from '@/shared/utils/format';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';
import { currentMoneyPerSec, maxLevelIncome } from '@/shared/utils/calculations';
import { MutationChip } from '@/components/brainrot/MutationChip';

type Props = {
  user: UserBrainrot;
  brainrot: Brainrot;
  mutation: Mutation | null;
  position?: number;
  isRecent?: boolean;
  onClick?: () => void;
};

export function BrainrotCard({
  user,
  brainrot,
  mutation,
  position,
  isRecent = false,
  onClick,
}: Props) {
  const income = currentMoneyPerSec(brainrot, user.level, mutation);
  const maxIncome = maxLevelIncome(brainrot);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col gap-3 rounded-2xl border p-5 text-left transition-colors min-h-[120px]',
        isRecent
          ? 'border-foreground bg-foreground/[0.04] shadow-[inset_0_0_0_1px_var(--foreground)]'
          : 'border-border bg-card hover:border-foreground/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold leading-tight text-foreground">
          {brainrot.name}
        </div>
        {isRecent ? (
          <span className="shrink-0 rounded-md bg-foreground px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-background">
            new
          </span>
        ) : position !== undefined ? (
          <span className="font-mono text-xs text-muted-foreground">
            #{position.toString().padStart(2, '0')}
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3">
        <div>{mutation && <MutationChip mutation={mutation} variant="chip" />}</div>
        <div className="font-mono text-xs tabular-nums text-muted-foreground">
          {formatNumber(maxIncome)}
        </div>
        <div className="font-mono text-xl font-semibold tabular-nums text-foreground">
          {formatNumber(income)}
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">/s</span>
        </div>
      </div>
    </button>
  );
}
