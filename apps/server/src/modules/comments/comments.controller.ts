import type { FastifyReply, FastifyRequest } from 'fastify'
import { postCommentBodySchema } from './comments.model.js'
import type { CommentsService } from './comments.service.js'

function badInput(reply: FastifyReply) {
  return reply.status(400).send({ success: false, error: 'Invalid input', code: 'VALIDATION' })
}

export function createCommentsController(service: CommentsService) {
  return {
    async listForListing(request: FastifyRequest, reply: FastifyReply) {
      const q = request.query as { cursor?: string; limit?: string }
      const limit = Math.min(80, Math.max(1, Number(q.limit) || 30))
      const out = await service.listForListing(
        String((request.params as { listingId: string }).listingId),
        limit,
      )
      if (out.kind === 'bad_id') {
        return reply.status(400).send({ success: false, error: 'Invalid id', code: 'VALIDATION' })
      }
      return reply.send({
        success: true,
        data: { comments: out.comments, nextCursor: out.nextCursor },
      })
    },

    async create(request: FastifyRequest, reply: FastifyReply) {
      const parsed = postCommentBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.create(
        request.userId!,
        String((request.params as { listingId: string }).listingId),
        parsed.data,
      )
      if (out.kind === 'bad_id') {
        return reply.status(400).send({ success: false, error: 'Invalid id', code: 'VALIDATION' })
      }
      if (out.kind === 'bad_parent') {
        return reply
          .status(400)
          .send({ success: false, error: 'Invalid parent', code: 'VALIDATION' })
      }
      if (out.kind === 'bad_thread') {
        return reply
          .status(400)
          .send({ success: false, error: 'Invalid thread', code: 'VALIDATION' })
      }
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'Not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { comment: out.comment } })
    },

    async delete(request: FastifyRequest, reply: FastifyReply) {
      const out = await service.delete(
        request.userId!,
        String((request.params as { id: string }).id),
      )
      if (out.kind === 'bad_id') {
        return reply.status(400).send({ success: false, error: 'Invalid id', code: 'VALIDATION' })
      }
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'Not found', code: 'NOT_FOUND' })
      }
      if (out.kind === 'forbidden') {
        return reply.status(403).send({ success: false, error: 'Forbidden', code: 'FORBIDDEN' })
      }
      return reply.send({ success: true, data: { ok: true } })
    },
  }
}
