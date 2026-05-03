import { getBase } from '@/server/services/base';
import { brainrots } from '@/shared/data/brainrots';
import { mutations } from '@/shared/data/mutations';
import { totalIncome } from '@/shared/utils/calculations';
import { StatsHeader } from '@/components/stats/StatsHeader';
import { DashboardClient } from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const base = await getBase();
  const total = totalIncome(base, { brainrots, mutations });

  return (
    <div className="space-y-12">
      <StatsHeader totalIncomePerSec={total} count={base.length} />
      <DashboardClient base={base} brainrots={brainrots} mutations={mutations} />
    </div>
  );
}
