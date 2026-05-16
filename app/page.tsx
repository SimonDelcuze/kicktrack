import { getBase } from '@/server/services/base';
import { getTrade } from '@/server/services/trade';
import { getTradeLog } from '@/server/services/trade-log';
import { brainrots } from '@/shared/data/brainrots';
import { mutations } from '@/shared/data/mutations';
import { DashboardClient } from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [base, trade, tradeLog] = await Promise.all([
    getBase(),
    getTrade(),
    getTradeLog(),
  ]);

  return (
    <DashboardClient
      base={base}
      trade={trade}
      tradeLog={tradeLog}
      brainrots={brainrots}
      mutations={mutations}
    />
  );
}
