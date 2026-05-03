import { formatNumber } from '@/shared/utils/format';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';
import { currentMoneyPerSec } from '@/shared/utils/calculations';
import { MutationChip } from '@/components/brainrot/MutationChip';

type Props = {
  user: UserBrainrot;
  brainrot: Brainrot;
  mutation: Mutation | null;
  onClick?: () => void;
};

export function BrainrotCard({ user, brainrot, mutation, onClick }: Props) {
  const income = currentMoneyPerSec(brainrot, user.level, mutation);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[170px] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card/30 p-5 text-left transition-all duration-200 hover:border-foreground/30 hover:bg-card/60"
    >
      <div>
        <div className="font-serif text-lg leading-snug text-foreground">
          {user.nickname || brainrot.name}
        </div>
        {user.nickname && (
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {brainrot.name}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          lvl <span className="text-foreground/90">{user.level}</span>
        </div>
        {mutation && <MutationChip mutation={mutation} variant="chip" />}
      </div>

      <div className="mt-5 flex items-baseline justify-between border-t border-border/60 pt-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          income
        </span>
        <span className="font-mono text-base tabular-nums text-foreground transition-colors group-hover:text-primary">
          {formatNumber(income)}/s
        </span>
      </div>
    </button>
  );
}
