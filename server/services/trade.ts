import 'server-only';
import { v4 as uuidv4 } from 'uuid';
import { redis, TRADE_KEY, TRADE_LOG_KEY } from '@/server/lib/kv';
import {
  userBrainrotArraySchema,
  tradeLogEventSchema,
} from '@/shared/schemas/user-brainrot';
import type { TradeLogEvent, UserBrainrot } from '@/shared/types';

export async function getTrade(): Promise<UserBrainrot[]> {
  const raw = await redis.get<UserBrainrot[]>(TRADE_KEY);
  return raw ?? [];
}

export async function addToTrade(
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

  const trade = await getTrade();
  await redis.set(TRADE_KEY, [...trade, entry]);

  const log = (await redis.get<TradeLogEvent[]>(TRADE_LOG_KEY)) ?? [];
  await redis.set(TRADE_LOG_KEY, [...log, tradeLogEventSchema.parse(event)]);

  return { entry, event };
}

export async function removeOneByComboFromTrade(
  brainrot_id: number,
  mutation_id: number | null,
): Promise<{ removedId: string; event: TradeLogEvent } | null> {
  const trade = await getTrade();
  // Most-recent first by created_at.
  const sortedDesc = [...trade].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const target = sortedDesc.find(
    (e) => e.brainrot_id === brainrot_id && e.mutation_id === mutation_id,
  );
  if (!target) return null;

  const next = trade.filter((e) => e.id !== target.id);
  await redis.set(TRADE_KEY, next);

  const event: TradeLogEvent = {
    id: uuidv4(),
    ts: new Date().toISOString(),
    op: '-',
    brainrot_id,
    mutation_id,
  };
  const log = (await redis.get<TradeLogEvent[]>(TRADE_LOG_KEY)) ?? [];
  await redis.set(TRADE_LOG_KEY, [...log, tradeLogEventSchema.parse(event)]);

  return { removedId: target.id, event };
}

export async function replaceTrade(entries: UserBrainrot[]): Promise<void> {
  const validated = userBrainrotArraySchema.parse(entries);
  await redis.set(TRADE_KEY, validated);
}
