import { z } from 'zod';

export const userBrainrotInputSchema = z.object({
  brainrot_id: z.number().int().positive(),
  mutation_id: z.number().int().positive().nullable(),
  level: z.number().int().min(1).max(75),
  nickname: z.string().trim().max(50).optional(),
});

export const userBrainrotSchema = userBrainrotInputSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const userBrainrotArraySchema = z.array(userBrainrotSchema);

export type UserBrainrotInput = z.infer<typeof userBrainrotInputSchema>;
