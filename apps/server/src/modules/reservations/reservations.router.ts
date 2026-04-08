import type { FastifyPluginAsync } from 'fastify'
import { requireAuth, requireEmailVerified } from '../../hooks/auth-pre.js'
import { createReservationsRepository } from './reservations.repository.js'
import { createReservationsService } from './reservations.service.js'
import { createReservationsController } from './reservations.controller.js'

export const reservationRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createReservationsRepository(fastify.deps.db)
  const service = createReservationsService(repo)
  const c = createReservationsController(service)

  fastify.get('/', { preValidation: [requireAuth] }, c.list)
  fastify.post(
    '/',
    {
      preHandler: [requireAuth, requireEmailVerified],
      config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
    },
    c.create,
  )
  fastify.patch('/:id', { preValidation: [requireAuth] }, c.patch)
}
