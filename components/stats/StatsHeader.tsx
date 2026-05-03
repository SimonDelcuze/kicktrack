import { formatNumber } from '@/shared/utils/format';

type Props = {
  totalIncomePerSec: number;
  count: number;
};

export function StatsHeader({ totalIncomePerSec, count }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 mb-8">
      <div className="rounded-xl border border-border p-6">
        <div className="text-sm text-muted-foreground">Total income / sec</div>
        <div className="text-4xl font-bold">{formatNumber(totalIncomePerSec)}</div>
      </div>
      <div className="rounded-xl border border-border p-6">
        <div className="text-sm text-muted-foreground">Brainrots in base</div>
        <div className="text-4xl font-bold">{count}</div>
      </div>
    </div>
  );
}
