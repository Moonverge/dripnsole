import { z } from 'zod'

export const createReservationBodySchema = z.object({
  listing_id: z.string(),
})

export const patchReservationBodySchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'expired']).optional(),
})

export type CreateReservationBody = z.infer<typeof createReservationBodySchema>
export type PatchReservationBody = z.infer<typeof patchReservationBodySchema>
