import { z } from 'zod'

export const postCommentBodySchema = z.object({
  content: z.string().min(1).max(500),
  parentId: z.string().optional(),
})

export type PostCommentBody = z.infer<typeof postCommentBodySchema>
