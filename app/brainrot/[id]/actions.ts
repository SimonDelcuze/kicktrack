'use server';

import { revalidatePath } from 'next/cache';
import { updateBrainrot, deleteBrainrot, getBase } from '@/server/services/base';
import { userBrainrotInputSchema } from '@/shared/schemas/user-brainrot';
import type { UserBrainrot } from '@/shared/types';

export async function updateBrainrotAction(
  slug: string,
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
  const previousBase = await getBase(slug);
  const updated = await updateBrainrot(slug, id, input);
  revalidatePath('/u/' + slug);
  return { updated, previousBase };
}

export async function deleteBrainrotAction(
  slug: string,
  id: string,
): Promise<{ deleted: boolean; previousBase: UserBrainrot[] }> {
  const previousBase = await getBase(slug);
  const deleted = await deleteBrainrot(slug, id);
  revalidatePath('/u/' + slug);
  return { deleted, previousBase };
}
