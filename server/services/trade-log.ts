import 'server-only';
import { redis, TRADE_LOG_KEY } from '@/server/lib/kv';
import {
  tradeLogEventSchema,
  tradeLogArraySchema,
  type TradeLogEventInput,
} from '@/shared/schemas/user-brainrot';
import type { TradeLogEvent } from '@/shared/types';

export async function getTradeLog(): Promise<TradeLogEvent[]> {
  const raw = await redis.get<TradeLogEvent[]>(TRADE_LOG_KEY);
  return raw ?? [];
}

export async function appendTradeLogEvent(event: TradeLogEventInput): Promise<void> {
  const validated = tradeLogEventSchema.parse(event);
  const current = await getTradeLog();
  await redis.set(TRADE_LOG_KEY, [...current, validated]);
}

export async function removeTradeLogEventById(id: string): Promise<boolean> {
  const current = await getTradeLog();
  const next = current.filter((e) => e.id !== id);
  if (next.length === current.length) return false;
  await redis.set(TRADE_LOG_KEY, next);
  return true;
}

export async function replaceTradeLog(events: TradeLogEvent[]): Promise<void> {
  const validated = tradeLogArraySchema.parse(events);
  await redis.set(TRADE_LOG_KEY, validated);
}
