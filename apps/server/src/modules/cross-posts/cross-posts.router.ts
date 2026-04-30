import type { FastifyPluginAsync } from 'fastify'
import { requireAuth, requireSeller } from '../../hooks/auth-pre.js'
import { createCrossPostsRepository } from './cross-posts.repository.js'
import { createCrossPostsService } from './cross-posts.service.js'
import { createCrossPostsController } from './cross-posts.controller.js'

export const crossPostsRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createCrossPostsRepository(fastify.deps.db)
  const service = createCrossPostsService({
    repo,
    env: fastify.deps.env,
  })
  const c = createCrossPostsController(service)

  const sellerGuard = { preValidation: [requireAuth, requireSeller] }

  fastify.get('/meta/callback', { config: { public: true } }, c.metaCallback)

  fastify.get('/meta/oauth-url', sellerGuard, c.metaOAuthUrl)
  fastify.get('/meta', sellerGuard, c.getMetaConnection)
  fastify.delete('/meta', sellerGuard, c.clearMetaConnection)

  fastify.post(
    '/listings/:id',
    {
      ...sellerGuard,
      config: { rateLimit: { max: 30, timeWindow: '1 hour' } },
    },
    c.singlePost,
  )
  fastify.post(
    '/bulk',
    {
      ...sellerGuard,
      config: { rateLimit: { max: 6, timeWindow: '1 hour' } },
    },
    c.bulkPost,
  )
  fastify.post('/listings/:id/sold', sellerGuard, c.sold)
  fastify.get('/listings/:id', sellerGuard, c.history)
}
