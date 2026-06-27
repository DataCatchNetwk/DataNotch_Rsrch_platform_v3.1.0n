import { z } from 'zod'

export const bulkJobActionSchema = z.object({
  jobIds: z.array(z.string().trim().min(1)).min(1).max(500),
})

export type BulkJobActionDto = z.infer<typeof bulkJobActionSchema>
