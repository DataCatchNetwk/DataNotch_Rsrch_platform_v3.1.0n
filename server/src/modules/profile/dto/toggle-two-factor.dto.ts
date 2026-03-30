import { z } from 'zod'

export const toggleTwoFactorSchema = z.object({
  enabled: z.boolean(),
})
