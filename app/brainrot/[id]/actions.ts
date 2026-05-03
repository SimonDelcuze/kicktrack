'use server';

import { revalidatePath } from 'next/cache';
import { updateBrainrot, deleteBrainrot, getBase } from '@/server/services/base';
import { userBrainrotInputSchema } from '@/shared/schemas/user-brainrot';
import type { UserBrainrot } from '@/shared/types';

export async function updateBrainrotAction(
  id: string,
  formData: FormData,
): Promise<{ updated: UserBrainrot | null; previousBase: UserBrainrot[] }> {
  const input = userBrainrotInputSchema.parse({
    brainrot_id: Number(formData.get('brainrot_id')),
    mutation_id:
      formData.get('mutation_id') === '' || formData.get('mutation_id') === 'null'
        ? null
        : Number(formData.get('mutation_id')),
    level: Number(formData.get('level')),
    nickname: (formData.get('nickname') as string | null) || undefined,
  });
  const previousBase = await getBase();
  const updated = await updateBrainrot(id, input);
  revalidatePath('/');
  return { updated, previousBase };
}

export async function deleteBrainrotAction(
  id: string,
): Promise<{ deleted: boolean; previousBase: UserBrainrot[] }> {
  const previousBase = await getBase();
  const deleted = await deleteBrainrot(id);
  revalidatePath('/');
  return { deleted, previousBase };
}
