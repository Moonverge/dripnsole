import type { FastifyPluginAsync } from 'fastify'
import { requireAuth, requireEmailVerified } from '../../hooks/auth-pre.js'
import { createOffersRepository } from './offers.repository.js'
import { createOffersService } from './offers.service.js'
import { createOffersController } from './offers.controller.js'

export const offerRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createOffersRepository(fastify.deps.db)
  const service = createOffersService(repo)
  const c = createOffersController(service)

  fastify.post(
    '/',
    {
      preValidation: [requireAuth, requireEmailVerified],
      config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
    },
    c.create,
  )
  fastify.patch('/:id', { preValidation: [requireAuth] }, c.patch)
}
