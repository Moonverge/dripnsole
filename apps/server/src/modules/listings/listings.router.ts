import type { FastifyPluginAsync } from 'fastify'
import { requireAuth, requireEmailVerified } from '../../hooks/auth-pre.js'
import { createListingsRepository } from './listings.repository.js'
import { createListingsService } from './listings.service.js'
import { createListingsController } from './listings.controller.js'

export const listingRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createListingsRepository(fastify.deps.db)
  const service = createListingsService({
    db: fastify.deps.db,
    redis: fastify.deps.redis,
    repo,
  })
  const c = createListingsController(service)

  fastify.post(
    '/',
    {
      preValidation: [requireAuth, requireEmailVerified],
      config: { rateLimit: { max: 30, timeWindow: '1 hour' } },
    },
    c.create,
  )

  fastify.get('/', { config: { public: true } }, c.listPublished)

  fastify.get(
    '/search',
    { config: { public: true, rateLimit: { max: 60, timeWindow: '1 minute' } } },
    c.search,
  )

  fastify.get('/feed', { preValidation: [requireAuth] }, c.feed)
  fastify.get('/me', { preValidation: [requireAuth] }, c.myListings)
  fastify.get('/following', { preValidation: [requireAuth] }, c.followingListings)

  fastify.get('/:id', { config: { public: true } }, c.getById)
  fastify.put('/:id', { preValidation: [requireAuth] }, c.update)
  fastify.delete('/:id', { preValidation: [requireAuth] }, c.deleteListing)
  fastify.patch('/:id/availability', { preValidation: [requireAuth] }, c.setAvailability)
  fastify.post('/:id/save', { preValidation: [requireAuth] }, c.toggleSave)
}
