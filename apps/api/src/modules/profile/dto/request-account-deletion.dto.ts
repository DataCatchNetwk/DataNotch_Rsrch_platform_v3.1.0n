import { z } from 'zod'

export const requestAccountDeletionSchema = z.object({
  reason: z.string().trim().min(3).max(500).optional(),
})

export type RequestAccountDeletionDto = z.infer<typeof requestAccountDeletionSchema>
