import type { FastifyPluginAsync } from 'fastify'
import { requireAuth, requireEmailVerified } from '../../hooks/auth-pre.js'
import { createCommentsRepository } from './comments.repository.js'
import { createCommentsService } from './comments.service.js'
import { createCommentsController } from './comments.controller.js'

export const commentRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createCommentsRepository(fastify.deps.db)
  const service = createCommentsService(repo)
  const c = createCommentsController(service)

  fastify.get('/listings/:listingId/comments', { config: { public: true } }, c.listForListing)
  fastify.post(
    '/listings/:listingId/comments',
    {
      preValidation: [requireAuth, requireEmailVerified],
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    c.create,
  )
  fastify.delete('/comments/:id', { preValidation: [requireAuth] }, c.delete)
}
