import 'server-only';
import { redis, tradeLogKey, SIMON_SLUG, LEGACY_TRADE_LOG_KEY } from '@/server/lib/kv';
import {
  tradeLogEventSchema,
  tradeLogArraySchema,
  type TradeLogEventInput,
} from '@/shared/schemas/user-brainrot';
import type { TradeLogEvent } from '@/shared/types';

export async function getTradeLog(slug: string): Promise<TradeLogEvent[]> {
  const raw = await redis.get<TradeLogEvent[]>(tradeLogKey(slug));
  if (raw !== null) return raw;
  if (slug === SIMON_SLUG) {
    const legacy = await redis.get<TradeLogEvent[]>(LEGACY_TRADE_LOG_KEY);
    if (legacy !== null) {
      await redis.set(tradeLogKey(slug), legacy);
      await redis.del(LEGACY_TRADE_LOG_KEY);
      return legacy;
    }
  }
  return [];
}

export async function appendTradeLogEvent(slug: string, event: TradeLogEventInput): Promise<void> {
  const validated = tradeLogEventSchema.parse(event);
  const current = await getTradeLog(slug);
  await redis.set(tradeLogKey(slug), [...current, validated]);
}

export async function removeTradeLogEventById(slug: string, id: string): Promise<boolean> {
  const current = await getTradeLog(slug);
  const next = current.filter((e) => e.id !== id);
  if (next.length === current.length) return false;
  await redis.set(tradeLogKey(slug), next);
  return true;
}

export async function replaceTradeLog(slug: string, events: TradeLogEvent[]): Promise<void> {
  const validated = tradeLogArraySchema.parse(events);
  await redis.set(tradeLogKey(slug), validated);
}
