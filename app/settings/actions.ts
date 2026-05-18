'use server';

import { revalidatePath } from 'next/cache';
import { getBase, replaceBase } from '@/server/services/base';
import { userBrainrotArraySchema } from '@/shared/schemas/user-brainrot';
import type { UserBrainrot } from '@/shared/types';

export async function exportBaseAction(slug: string): Promise<string> {
  const base = await getBase(slug);
  return JSON.stringify(base, null, 2);
}

export async function importBaseAction(
  slug: string,
  formData: FormData,
): Promise<{ ok: true; previousBase: UserBrainrot[] } | { ok: false; error: string }> {
  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'No file provided' };
  if (file.size > 1024 * 1024) return { ok: false, error: 'File too large (max 1MB)' };

  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }

  const result = userBrainrotArraySchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, error: 'JSON does not match expected shape' };
  }

  const previousBase = await getBase(slug);
  await replaceBase(slug, result.data);
  revalidatePath('/u/' + slug);
  return { ok: true, previousBase };
}
