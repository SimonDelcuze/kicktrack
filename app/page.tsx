import { getBase } from '@/server/services/base';
import { brainrots, brainrotById } from '@/shared/data/brainrots';
import { mutations, mutationById } from '@/shared/data/mutations';
import { rarityById } from '@/shared/data/rarities';
import { totalIncome } from '@/shared/utils/calculations';
import { StatsHeader } from '@/components/stats/StatsHeader';
import { BrainrotCard } from '@/components/brainrot/BrainrotCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const base = await getBase();
  const total = totalIncome(base, { brainrots, mutations });

  return (
    <>
      <StatsHeader totalIncomePerSec={total} count={base.length} />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your base</h2>
        <Link href="/add">
          <Button>Add brainrot</Button>
        </Link>
      </div>

      {base.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Your base is empty. <Link href="/add" className="underline">Add your first brainrot</Link>.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {base.map((user) => {
            const brainrot = brainrotById(user.brainrot_id);
            if (!brainrot) return null;
            const rarity = rarityById(brainrot.rarity_id);
            const mutation =
              user.mutation_id != null ? mutationById(user.mutation_id) ?? null : null;
            return (
              <BrainrotCard
                key={user.id}
                user={user}
                brainrot={brainrot}
                rarity={rarity}
                mutation={mutation}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
