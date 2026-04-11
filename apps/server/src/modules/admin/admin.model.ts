import { z } from 'zod'

export const updateUserRoleSchema = z.object({
  role: z.enum(['buyer', 'seller']),
})

export const suspendUserSchema = z.object({})

export const updatePlatformSettingSchema = z.object({
  value: z.unknown(),
})

export const updateReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
})

export const setBadgeSchema = z.object({
  badge: z.enum(['new', 'verified', 'top']),
})

export type UpdateUserRoleBody = z.infer<typeof updateUserRoleSchema>
export type UpdatePlatformSettingBody = z.infer<typeof updatePlatformSettingSchema>
export type UpdateReportBody = z.infer<typeof updateReportSchema>
export type SetBadgeBody = z.infer<typeof setBadgeSchema>
