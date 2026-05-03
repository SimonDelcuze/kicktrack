import 'server-only';
import { v4 as uuidv4 } from 'uuid';
import { redis, BASE_KEY } from '@/server/lib/kv';
import {
  userBrainrotInputSchema,
  userBrainrotArraySchema,
  type UserBrainrotInput,
} from '@/shared/schemas/user-brainrot';
import type { UserBrainrot } from '@/shared/types';

export async function getBase(): Promise<UserBrainrot[]> {
  const raw = await redis.get<UserBrainrot[]>(BASE_KEY);
  return raw ?? [];
}

export async function addBrainrot(input: UserBrainrotInput): Promise<UserBrainrot> {
  const validated = userBrainrotInputSchema.parse(input);
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
  const base = await getBase();
  await redis.set(BASE_KEY, [...base, entry]);
  return entry;
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
  await redis.set(BASE_KEY, validated);
}
