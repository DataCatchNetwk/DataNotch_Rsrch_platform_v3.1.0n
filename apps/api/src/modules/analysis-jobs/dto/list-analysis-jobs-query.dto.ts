import { z } from 'zod'

export const analysisJobsSortSchema = z.enum([
  'submittedAt:desc',
  'submittedAt:asc',
  'runtimeMinutes:desc',
  'status:asc',
  'updatedAt:desc',
])

export const analysisJobStatusSchema = z.enum([
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
])

export const listAnalysisJobsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: analysisJobStatusSchema.optional(),
  workspaceId: z.string().trim().min(1).optional(),
  datasetId: z.string().trim().min(1).optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
  sort: analysisJobsSortSchema.optional(),
  submittedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
})

export type ListAnalysisJobsQueryDto = z.infer<typeof listAnalysisJobsQuerySchema>
