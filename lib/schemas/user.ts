import { z } from 'zod';

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  username: z.string().default(''),
  full_name: z.string().default(''),
  is_worker: z.boolean(),
  is_company: z.boolean(),
  created_at: z.string().default(''),
});

export type User = z.infer<typeof userSchema>;
