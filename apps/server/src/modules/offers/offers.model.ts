import { z } from 'zod'

export const createOfferBodySchema = z.object({
  listing_id: z.string(),
  amount: z.number().int().positive().max(999_999),
})

export const patchOfferBodySchema = z.object({
  status: z.enum(['accepted', 'declined', 'countered']).optional(),
  counter_amount: z.number().int().positive().max(999_999).optional(),
})

export type CreateOfferBody = z.infer<typeof createOfferBodySchema>
export type PatchOfferBody = z.infer<typeof patchOfferBodySchema>
