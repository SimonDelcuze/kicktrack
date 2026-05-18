'use server';

import { revalidatePath } from 'next/cache';
import {
  getTrade,
  addToTrade,
  removeOneByComboFromTrade,
  replaceTrade,
} from '@/server/services/trade';
import {
  getTradeLog,
  replaceTradeLog,
} from '@/server/services/trade-log';
import type { TradeLogEvent, UserBrainrot } from '@/shared/types';

export type TradeMutationResult = {
  ok: boolean;
  previousTrade: UserBrainrot[];
  previousLog: TradeLogEvent[];
};

export async function addToTradeAction(
  slug: string,
  brainrot_id: number,
  mutation_id: number | null,
): Promise<TradeMutationResult> {
  const previousTrade = await getTrade(slug);
  const previousLog = await getTradeLog(slug);
  await addToTrade(slug, brainrot_id, mutation_id);
  revalidatePath('/u/' + slug);
  return { ok: true, previousTrade, previousLog };
}

export async function removeOneFromTradeAction(
  slug: string,
  brainrot_id: number,
  mutation_id: number | null,
): Promise<TradeMutationResult> {
  const previousTrade = await getTrade(slug);
  const previousLog = await getTradeLog(slug);
  const removed = await removeOneByComboFromTrade(slug, brainrot_id, mutation_id);
  if (removed) revalidatePath('/u/' + slug);
  return { ok: removed !== null, previousTrade, previousLog };
}

export async function setTradeAndLogAction(
  slug: string,
  nextTrade: UserBrainrot[],
  nextLog: TradeLogEvent[],
): Promise<{ previousTrade: UserBrainrot[]; previousLog: TradeLogEvent[] }> {
  const previousTrade = await getTrade(slug);
  const previousLog = await getTradeLog(slug);
  await replaceTrade(slug, nextTrade);
  await replaceTradeLog(slug, nextLog);
  revalidatePath('/u/' + slug);
  return { previousTrade, previousLog };
}

export type TradeBatchOp =
  | { kind: 'add'; brainrot_id: number; mutation_id: number | null }
  | { kind: 'remove'; brainrot_id: number; mutation_id: number | null };

export async function applyTradeBatchAction(
  slug: string,
  ops: TradeBatchOp[],
): Promise<{ ok: true }> {
  for (const op of ops) {
    if (op.kind === 'add') {
      await addToTrade(slug, op.brainrot_id, op.mutation_id);
    } else {
      // null when no entry matches — silently skip (optimistic state drifted)
      await removeOneByComboFromTrade(slug, op.brainrot_id, op.mutation_id);
    }
  }
  if (ops.length > 0) revalidatePath('/u/' + slug);
  return { ok: true };
}
