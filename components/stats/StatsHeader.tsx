import { formatNumber } from '@/shared/utils/format';

type Props = {
  totalIncomePerSec: number;
  count: number;
};

export function StatsHeader({ totalIncomePerSec, count }: Props) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Total income / sec
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-5xl font-semibold tracking-tight tabular-nums">
            {formatNumber(totalIncomePerSec)}
          </span>
          <span className="text-sm text-muted-foreground">/s</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Brainrots in base
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-5xl font-semibold tabular-nums">
            {count}
          </span>
          <span className="text-sm text-muted-foreground">/ 30</span>
        </div>
      </div>
    </section>
  );
}
