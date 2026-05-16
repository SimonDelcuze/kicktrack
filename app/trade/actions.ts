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
  brainrot_id: number,
  mutation_id: number | null,
): Promise<TradeMutationResult> {
  const previousTrade = await getTrade();
  const previousLog = await getTradeLog();
  await addToTrade(brainrot_id, mutation_id);
  revalidatePath('/');
  return { ok: true, previousTrade, previousLog };
}

export async function removeOneFromTradeAction(
  brainrot_id: number,
  mutation_id: number | null,
): Promise<TradeMutationResult> {
  const previousTrade = await getTrade();
  const previousLog = await getTradeLog();
  const removed = await removeOneByComboFromTrade(brainrot_id, mutation_id);
  if (removed) revalidatePath('/');
  return { ok: removed !== null, previousTrade, previousLog };
}

export async function setTradeAndLogAction(
  nextTrade: UserBrainrot[],
  nextLog: TradeLogEvent[],
): Promise<{ previousTrade: UserBrainrot[]; previousLog: TradeLogEvent[] }> {
  const previousTrade = await getTrade();
  const previousLog = await getTradeLog();
  await replaceTrade(nextTrade);
  await replaceTradeLog(nextLog);
  revalidatePath('/');
  return { previousTrade, previousLog };
}
