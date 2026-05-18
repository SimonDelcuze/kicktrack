import 'server-only';
import { v4 as uuidv4 } from 'uuid';
import { redis, tradeKey, tradeLogKey, SIMON_SLUG, LEGACY_TRADE_KEY } from '@/server/lib/kv';
import {
  userBrainrotArraySchema,
  tradeLogEventSchema,
} from '@/shared/schemas/user-brainrot';
import type { TradeLogEvent, UserBrainrot } from '@/shared/types';

export async function getTrade(slug: string): Promise<UserBrainrot[]> {
  const raw = await redis.get<UserBrainrot[]>(tradeKey(slug));
  if (raw !== null) return raw;
  if (slug === SIMON_SLUG) {
    const legacy = await redis.get<UserBrainrot[]>(LEGACY_TRADE_KEY);
    if (legacy !== null) {
      await redis.set(tradeKey(slug), legacy);
      await redis.del(LEGACY_TRADE_KEY);
      return legacy;
    }
  }
  return [];
}

export async function addToTrade(
  slug: string,
  brainrot_id: number,
  mutation_id: number | null,
): Promise<{ entry: UserBrainrot; event: TradeLogEvent }> {
  const now = new Date().toISOString();
  const entry: UserBrainrot = {
    id: uuidv4(),
    brainrot_id,
    mutation_id,
    level: 1,
    created_at: now,
    updated_at: now,
  };
  const event: TradeLogEvent = {
    id: uuidv4(),
    ts: now,
    op: '+',
    brainrot_id,
    mutation_id,
  };

  const trade = await getTrade(slug);
  await redis.set(tradeKey(slug), [...trade, entry]);

  const log = (await redis.get<TradeLogEvent[]>(tradeLogKey(slug))) ?? [];
  await redis.set(tradeLogKey(slug), [...log, tradeLogEventSchema.parse(event)]);

  return { entry, event };
}

export async function removeOneByComboFromTrade(
  slug: string,
  brainrot_id: number,
  mutation_id: number | null,
): Promise<{ removedId: string; event: TradeLogEvent } | null> {
  const trade = await getTrade(slug);
  // Most-recent first by created_at.
  const sortedDesc = [...trade].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const target = sortedDesc.find(
    (e) => e.brainrot_id === brainrot_id && e.mutation_id === mutation_id,
  );
  if (!target) return null;

  const next = trade.filter((e) => e.id !== target.id);
  await redis.set(tradeKey(slug), next);

  const event: TradeLogEvent = {
    id: uuidv4(),
    ts: new Date().toISOString(),
    op: '-',
    brainrot_id,
    mutation_id,
  };
  const log = (await redis.get<TradeLogEvent[]>(tradeLogKey(slug))) ?? [];
  await redis.set(tradeLogKey(slug), [...log, tradeLogEventSchema.parse(event)]);

  return { removedId: target.id, event };
}

export async function replaceTrade(slug: string, entries: UserBrainrot[]): Promise<void> {
  const validated = userBrainrotArraySchema.parse(entries);
  await redis.set(tradeKey(slug), validated);
}
