import { z } from 'zod'

export const createReviewBodySchema = z.object({
  transaction_id: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export type CreateReviewBody = z.infer<typeof createReviewBodySchema>
