'use server';

import { revalidatePath } from 'next/cache';
import { addBrainrot, getBase, removeOneByComboFromBase, type AddResult } from '@/server/services/base';
import { userBrainrotInputSchema } from '@/shared/schemas/user-brainrot';
import type { UserBrainrot } from '@/shared/types';

export type CreateActionResult = AddResult & { previousBase: UserBrainrot[] };

export async function createBrainrotAction(formData: FormData): Promise<CreateActionResult> {
  const input = userBrainrotInputSchema.parse({
    brainrot_id: Number(formData.get('brainrot_id')),
    mutation_id:
      formData.get('mutation_id') === '' || formData.get('mutation_id') === 'null'
        ? null
        : Number(formData.get('mutation_id')),
    level: Number(formData.get('level')),
    nickname: (formData.get('nickname') as string | null) || undefined,
  });
  const previousBase: UserBrainrot[] = await getBase();
  const result = await addBrainrot(input);
  if (result.ok) {
    revalidatePath('/');
  }
  return { ...result, previousBase };
}

export async function removeOneByComboFromBaseAction(
  brainrot_id: number,
  mutation_id: number | null,
  level: number,
): Promise<{ ok: boolean; previousBase: UserBrainrot[] }> {
  const previousBase = await getBase();
  const removed = await removeOneByComboFromBase(brainrot_id, mutation_id, level);
  if (removed) revalidatePath('/');
  return { ok: removed !== null, previousBase };
}
