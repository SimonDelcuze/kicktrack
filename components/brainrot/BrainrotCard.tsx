import { formatNumber } from '@/shared/utils/format';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';
import { currentMoneyPerSec } from '@/shared/utils/calculations';
import { MutationChip } from '@/components/brainrot/MutationChip';

type Props = {
  user: UserBrainrot;
  brainrot: Brainrot;
  mutation: Mutation | null;
  position?: number;
  onClick?: () => void;
};

export function BrainrotCard({ user, brainrot, mutation, position, onClick }: Props) {
  const income = currentMoneyPerSec(brainrot, user.level, mutation);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-foreground/40 min-h-[120px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold leading-tight text-foreground">
          {brainrot.name}
        </div>
        {position !== undefined && (
          <div className="font-mono text-xs text-muted-foreground">
            #{position.toString().padStart(2, '0')}
          </div>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3">
        <div>{mutation && <MutationChip mutation={mutation} variant="chip" />}</div>
        <div className="font-mono text-xl font-semibold tabular-nums text-foreground">
          {formatNumber(income)}
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">/s</span>
        </div>
      </div>
    </button>
  );
}
