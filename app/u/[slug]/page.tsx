import { getBase } from '@/server/services/base';
import { getTrade } from '@/server/services/trade';
import { getTradeLog } from '@/server/services/trade-log';
import { brainrots } from '@/shared/data/brainrots';
import { mutations } from '@/shared/data/mutations';
import { DashboardClient } from '@/components/DashboardClient';
import { HistoryProvider } from '@/components/HistoryProvider';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [base, trade, tradeLog] = await Promise.all([
    getBase(slug),
    getTrade(slug),
    getTradeLog(slug),
  ]);

  return (
    <HistoryProvider slug={slug}>
      <DashboardClient
        slug={slug}
        base={base}
        trade={trade}
        tradeLog={tradeLog}
        brainrots={brainrots}
        mutations={mutations}
      />
    </HistoryProvider>
  );
}
