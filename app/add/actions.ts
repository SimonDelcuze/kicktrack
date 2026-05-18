'use server';

import { revalidatePath } from 'next/cache';
import { addBrainrot, getBase, removeOneByComboFromBase, type AddResult } from '@/server/services/base';
import { userBrainrotInputSchema } from '@/shared/schemas/user-brainrot';
import type { UserBrainrot } from '@/shared/types';

export type CreateActionResult = AddResult & { previousBase: UserBrainrot[] };

export async function createBrainrotAction(slug: string, formData: FormData): Promise<CreateActionResult> {
  const input = userBrainrotInputSchema.parse({
    brainrot_id: Number(formData.get('brainrot_id')),
    mutation_id:
      formData.get('mutation_id') === '' || formData.get('mutation_id') === 'null'
        ? null
        : Number(formData.get('mutation_id')),
    level: Number(formData.get('level')),
    nickname: (formData.get('nickname') as string | null) || undefined,
  });
  const previousBase: UserBrainrot[] = await getBase(slug);
  const result = await addBrainrot(slug, input);
  if (result.ok) {
    revalidatePath('/u/' + slug);
  }
  return { ...result, previousBase };
}

export async function removeOneByComboFromBaseAction(
  slug: string,
  brainrot_id: number,
  mutation_id: number | null,
  level: number,
): Promise<{ ok: boolean; previousBase: UserBrainrot[] }> {
  const previousBase = await getBase(slug);
  const removed = await removeOneByComboFromBase(slug, brainrot_id, mutation_id, level);
  if (removed) revalidatePath('/u/' + slug);
  return { ok: removed !== null, previousBase };
}
