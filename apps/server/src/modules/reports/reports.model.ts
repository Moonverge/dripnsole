import { z } from 'zod'

export const createReportSchema = z.object({
  targetType: z.enum(['listing', 'user']),
  targetId: z.string().uuid(),
  reason: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
})

export type CreateReportBody = z.infer<typeof createReportSchema>
