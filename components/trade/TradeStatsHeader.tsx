import { formatNumber } from '@/shared/utils/format';
import { MAX_LEVEL, currentMoneyPerSec } from '@/shared/utils/calculations';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';

type Props = {
  entries: readonly UserBrainrot[];
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

export function TradeStatsHeader({ entries, brainrots, mutations }: Props) {
  const totalMax = entries.reduce((sum, ub) => {
    const brainrot = brainrots.find((b) => b.id === ub.brainrot_id);
    if (!brainrot) return sum;
    const mutation = ub.mutation_id != null
      ? mutations.find((m) => m.id === ub.mutation_id) ?? null
      : null;
    return sum + currentMoneyPerSec(brainrot, MAX_LEVEL, mutation);
  }, 0);

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Max-level total (×{MAX_LEVEL})
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-5xl font-semibold tracking-tight tabular-nums">
            {formatNumber(totalMax)}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Brainrots in trade
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-5xl font-semibold tabular-nums">
            {entries.length}
          </span>
        </div>
      </div>
    </section>
  );
}
