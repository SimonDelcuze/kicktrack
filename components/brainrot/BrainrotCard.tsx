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
      className="group relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-5 text-left transition-all duration-150 hover:border-foreground/30 hover:bg-card/70 min-h-[150px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-base font-medium leading-tight text-foreground">
          {brainrot.name}
        </div>
        {position !== undefined && (
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
            #{position.toString().padStart(2, '0')}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            lvl <span className="text-foreground">{user.level}</span>
          </div>
          {mutation && <MutationChip mutation={mutation} variant="chip" />}
        </div>
        <div className="font-mono text-xl tabular-nums text-foreground transition-colors group-hover:text-primary">
          {formatNumber(income)}
          <span className="ml-0.5 text-xs text-muted-foreground">/s</span>
        </div>
      </div>
    </button>
  );
}
