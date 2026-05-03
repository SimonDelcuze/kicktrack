import 'server-only';
import { v4 as uuidv4 } from 'uuid';
import { redis, BASE_KEY } from '@/server/lib/kv';
import {
  userBrainrotInputSchema,
  userBrainrotArraySchema,
  type UserBrainrotInput,
} from '@/shared/schemas/user-brainrot';
import type { UserBrainrot } from '@/shared/types';
import { brainrots } from '@/shared/data/brainrots';
import { mutations } from '@/shared/data/mutations';
import { currentMoneyPerSec } from '@/shared/utils/calculations';

export const MAX_BASE_SIZE = 30;

export type AddResult =
  | { ok: true; entry: UserBrainrot; evictedId?: string }
  | { ok: false; error: 'base_full_too_weak'; worstIncome: number; newcomerIncome: number };

function incomeOf(ub: UserBrainrot): number {
  const brainrot = brainrots.find((b) => b.id === ub.brainrot_id);
  if (!brainrot) return 0;
  const mutation =
    ub.mutation_id != null ? mutations.find((m) => m.id === ub.mutation_id) ?? null : null;
  return currentMoneyPerSec(brainrot, ub.level, mutation);
}

export async function getBase(): Promise<UserBrainrot[]> {
  const raw = await redis.get<UserBrainrot[]>(BASE_KEY);
  return raw ?? [];
}

export async function addBrainrot(input: UserBrainrotInput): Promise<AddResult> {
  const validated = userBrainrotInputSchema.parse(input);

  const brainrot = brainrots.find((b) => b.id === validated.brainrot_id);
  if (!brainrot) {
    throw new Error(`Unknown brainrot id ${validated.brainrot_id}`);
  }
  const mutation =
    validated.mutation_id != null
      ? mutations.find((m) => m.id === validated.mutation_id) ?? null
      : null;

  const newcomerIncome = currentMoneyPerSec(brainrot, validated.level, mutation);
  const base = await getBase();

  let nextBase = base;
  let evictedId: string | undefined;

  if (base.length >= MAX_BASE_SIZE) {
    // Find weakest current entry.
    const sortedAsc = [...base].sort((a, b) => incomeOf(a) - incomeOf(b));
    const weakest = sortedAsc[0];
    const worstIncome = incomeOf(weakest);

    if (newcomerIncome < worstIncome) {
      return { ok: false, error: 'base_full_too_weak', worstIncome, newcomerIncome };
    }

    nextBase = base.filter((b) => b.id !== weakest.id);
    evictedId = weakest.id;
  }

  const now = new Date().toISOString();
  const entry: UserBrainrot = {
    id: uuidv4(),
    brainrot_id: validated.brainrot_id,
    mutation_id: validated.mutation_id,
    level: validated.level,
    nickname: validated.nickname,
    created_at: now,
    updated_at: now,
  };

  await redis.set(BASE_KEY, [...nextBase, entry]);
  return { ok: true, entry, evictedId };
}

export async function updateBrainrot(
  id: string,
  patch: Partial<UserBrainrotInput>,
): Promise<UserBrainrot | null> {
  const base = await getBase();
  const idx = base.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const merged = { ...base[idx], ...patch };
  const validated = userBrainrotInputSchema.parse({
    brainrot_id: merged.brainrot_id,
    mutation_id: merged.mutation_id,
    level: merged.level,
    nickname: merged.nickname,
  });
  const updated: UserBrainrot = {
    ...base[idx],
    ...validated,
    updated_at: new Date().toISOString(),
  };
  const next = [...base];
  next[idx] = updated;
  await redis.set(BASE_KEY, next);
  return updated;
}

export async function deleteBrainrot(id: string): Promise<boolean> {
  const base = await getBase();
  const next = base.filter((b) => b.id !== id);
  if (next.length === base.length) return false;
  await redis.set(BASE_KEY, next);
  return true;
}

export async function replaceBase(incoming: UserBrainrot[]): Promise<void> {
  const validated = userBrainrotArraySchema.parse(incoming);
  if (validated.length > MAX_BASE_SIZE) {
    throw new Error(`Cannot replace base with more than ${MAX_BASE_SIZE} entries`);
  }
  await redis.set(BASE_KEY, validated);
}
