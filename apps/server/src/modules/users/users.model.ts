import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  profilePic: z.string().url().max(2000).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
})

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>
