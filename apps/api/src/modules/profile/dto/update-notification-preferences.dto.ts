import { z } from 'zod'

export const updateNotificationPreferencesSchema = z.object({
  preferences: z
    .array(
      z.object({
        key: z.string().trim().min(1),
        enabled: z.boolean(),
      })
    )
    .min(1)
    .max(50),
})

export type UpdateNotificationPreferencesDto = z.infer<
  typeof updateNotificationPreferencesSchema
>