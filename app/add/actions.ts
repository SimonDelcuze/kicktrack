'use server';

import { revalidatePath } from 'next/cache';
import { addBrainrot, type AddResult } from '@/server/services/base';
import { userBrainrotInputSchema } from '@/shared/schemas/user-brainrot';

export async function createBrainrotAction(formData: FormData): Promise<AddResult> {
  const input = userBrainrotInputSchema.parse({
    brainrot_id: Number(formData.get('brainrot_id')),
    mutation_id:
      formData.get('mutation_id') === '' || formData.get('mutation_id') === 'null'
        ? null
        : Number(formData.get('mutation_id')),
    level: Number(formData.get('level')),
    nickname: (formData.get('nickname') as string | null) || undefined,
  });
  const result = await addBrainrot(input);
  if (result.ok) {
    revalidatePath('/');
  }
  return result;
}
