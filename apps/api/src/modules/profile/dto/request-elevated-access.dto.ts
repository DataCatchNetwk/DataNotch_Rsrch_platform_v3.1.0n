import { z } from 'zod'

export const requestElevatedAccessSchema = z.object({
  reason: z.string().trim().min(3).max(500).optional(),
})

export type RequestElevatedAccessDto = z.infer<typeof requestElevatedAccessSchema>
