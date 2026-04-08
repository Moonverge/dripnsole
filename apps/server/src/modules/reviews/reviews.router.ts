import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../hooks/auth-pre.js'
import { createReviewsRepository } from './reviews.repository.js'
import { createReviewsService } from './reviews.service.js'
import { createReviewsController } from './reviews.controller.js'

export const reviewRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createReviewsRepository(fastify.deps.db)
  const service = createReviewsService(repo)
  const c = createReviewsController(service)

  fastify.post('/', { preValidation: [requireAuth] }, c.create)
}
