import { z } from 'zod'

export const createConversationBodySchema = z.object({
  listing_id: z.string(),
  recipient_id: z.string(),
})

export const messageBodySchema = z.object({
  content: z.string().min(1).max(1000),
})

export type CreateConversationBody = z.infer<typeof createConversationBodySchema>
export type MessageBody = z.infer<typeof messageBodySchema>
