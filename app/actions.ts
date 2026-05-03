'use server';

import { revalidatePath } from 'next/cache';
import { getBase, replaceBase } from '@/server/services/base';
import type { UserBrainrot } from '@/shared/types';

/**
 * Replace the entire base with the given snapshot. Used by undo/redo.
 * Returns the previous base so the caller can stash it on the redo/past stack.
 */
export async function setBaseAction(
  next: UserBrainrot[],
): Promise<{ previousBase: UserBrainrot[] }> {
  const previousBase = await getBase();
  await replaceBase(next);
  revalidatePath('/');
  return { previousBase };
}
