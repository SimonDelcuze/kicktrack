'use server';

import { revalidatePath } from 'next/cache';
import { addBrainrot } from '@/server/services/base';
import { userBrainrotInputSchema } from '@/shared/schemas/user-brainrot';

export async function createBrainrotAction(formData: FormData) {
  const input = userBrainrotInputSchema.parse({
    brainrot_id: Number(formData.get('brainrot_id')),
    mutation_id:
      formData.get('mutation_id') === '' || formData.get('mutation_id') === 'null'
        ? null
        : Number(formData.get('mutation_id')),
    level: Number(formData.get('level')),
    nickname: (formData.get('nickname') as string | null) || undefined,
  });
  await addBrainrot(input);
  revalidatePath('/');
}
