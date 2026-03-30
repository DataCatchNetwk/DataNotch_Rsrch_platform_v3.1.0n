import { z } from 'zod'

export const analysisJobIdParamSchema = z.object({
  jobId: z.string().trim().min(1),
})

export type AnalysisJobIdParamDto = z.infer<typeof analysisJobIdParamSchema>
