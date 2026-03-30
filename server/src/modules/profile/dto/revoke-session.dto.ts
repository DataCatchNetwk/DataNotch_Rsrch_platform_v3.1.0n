import { z } from 'zod'

export const revokeSessionSchema = z.object({
  reason: z.string().trim().max(280).optional(),
})
