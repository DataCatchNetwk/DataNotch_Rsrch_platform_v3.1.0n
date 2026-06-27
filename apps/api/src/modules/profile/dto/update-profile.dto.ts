import { z } from 'zod'

export const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    institution: z.string().trim().min(1).max(191).optional(),
    department: z.string().trim().min(1).max(191).optional(),
    researchGroup: z.string().trim().min(1).max(191).optional(),
    timezone: z.string().trim().regex(/^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one profile field must be provided',
  })

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>