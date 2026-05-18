import 'server-only';
import { v4 as uuidv4 } from 'uuid';
import { redis, baseKey, SIMON_SLUG, LEGACY_BASE_KEY } from '@/server/lib/kv';
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

export async function getBase(slug: string): Promise<UserBrainrot[]> {
  const raw = await redis.get<UserBrainrot[]>(baseKey(slug));
  if (raw !== null) return raw;
  if (slug === SIMON_SLUG) {
    const legacy = await redis.get<UserBrainrot[]>(LEGACY_BASE_KEY);
    if (legacy !== null) {
      await redis.set(baseKey(slug), legacy);
      await redis.del(LEGACY_BASE_KEY);
      return legacy;
    }
  }
  return [];
}

export async function addBrainrot(slug: string, input: UserBrainrotInput): Promise<AddResult> {
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
  const base = await getBase(slug);

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

  await redis.set(baseKey(slug), [...nextBase, entry]);
  return { ok: true, entry, evictedId };
}

export async function updateBrainrot(
  slug: string,
  id: string,
  patch: Partial<UserBrainrotInput>,
): Promise<UserBrainrot | null> {
  const base = await getBase(slug);
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
  await redis.set(baseKey(slug), next);
  return updated;
}

export async function deleteBrainrot(slug: string, id: string): Promise<boolean> {
  const base = await getBase(slug);
  const next = base.filter((b) => b.id !== id);
  if (next.length === base.length) return false;
  await redis.set(baseKey(slug), next);
  return true;
}

export async function replaceBase(slug: string, incoming: UserBrainrot[]): Promise<void> {
  const validated = userBrainrotArraySchema.parse(incoming);
  if (validated.length > MAX_BASE_SIZE) {
    throw new Error(`Cannot replace base with more than ${MAX_BASE_SIZE} entries`);
  }
  await redis.set(baseKey(slug), validated);
}

export async function removeOneByComboFromBase(
  slug: string,
  brainrot_id: number,
  mutation_id: number | null,
  level: number,
): Promise<{ removedId: string } | null> {
  const base = await getBase(slug);
  const sortedDesc = [...base].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const target = sortedDesc.find(
    (e) =>
      e.brainrot_id === brainrot_id &&
      e.mutation_id === mutation_id &&
      e.level === level,
  );
  if (!target) return null;
  const next = base.filter((e) => e.id !== target.id);
  await redis.set(baseKey(slug), next);
  return { removedId: target.id };
}
