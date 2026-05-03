import { brainrots } from '@/shared/data/brainrots';
import { rarities } from '@/shared/data/rarities';
import { bestMutation } from '@/shared/data/mutations';
import { maxPotential } from '@/shared/utils/calculations';
import { formatNumber } from '@/shared/utils/format';

export default function CatalogPage() {
  const sortedRarities = [...rarities].sort((a, b) => a.tier_order - b.tier_order);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Catalog</h1>
      <p className="text-muted-foreground mb-6">
        Best mutation: <span className="font-mono">{bestMutation.name}</span> ×{bestMutation.multiplier}
      </p>

      <div className="space-y-8">
        {sortedRarities.map((rarity) => {
          const inRarity = brainrots.filter((b) => b.rarity_id === rarity.id);
          if (inRarity.length === 0) return null;
          return (
            <section key={rarity.id}>
              <h2 className="text-xl font-semibold mb-3" style={{ color: rarity.color_hex }}>
                {rarity.name}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {inRarity.map((b) => (
                  <div key={b.id} className="rounded-xl border border-border p-4">
                    <div className="font-semibold">{b.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Base: {formatNumber(b.base_money_per_sec)}/s
                    </div>
                    <div className="text-sm mt-2 font-mono">
                      Max: {formatNumber(maxPotential(b, bestMutation))}/s
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
