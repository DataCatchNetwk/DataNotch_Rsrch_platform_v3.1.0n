import { z } from 'zod'

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
  })
