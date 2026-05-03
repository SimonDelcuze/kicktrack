import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/shared/utils/format';
import type { Brainrot, Mutation, Rarity, UserBrainrot } from '@/shared/types';
import { currentMoneyPerSec } from '@/shared/utils/calculations';

type Props = {
  user: UserBrainrot;
  brainrot: Brainrot;
  rarity?: Rarity;
  mutation: Mutation | null;
};

export function BrainrotCard({ user, brainrot, rarity, mutation }: Props) {
  const income = currentMoneyPerSec(brainrot, user.level, mutation);
  return (
    <Link
      href={`/brainrot/${user.id}`}
      className="rounded-xl border border-border p-4 transition hover:bg-accent"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{user.nickname || brainrot.name}</div>
          {user.nickname && (
            <div className="text-xs text-muted-foreground">{brainrot.name}</div>
          )}
        </div>
        {rarity && (
          <Badge style={{ backgroundColor: rarity.color_hex }}>{rarity.name}</Badge>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
        <span>Lvl {user.level}</span>
        {mutation && (
          <span style={{ color: mutation.color_hex }}>{mutation.name} ×{mutation.multiplier}</span>
        )}
      </div>
      <div className="mt-2 font-mono text-lg">{formatNumber(income)}/s</div>
    </Link>
  );
}
