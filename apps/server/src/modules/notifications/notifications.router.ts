import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../hooks/auth-pre.js'
import { createNotificationsRepository } from './notifications.repository.js'
import { createNotificationsService } from './notifications.service.js'
import { createNotificationsController } from './notifications.controller.js'

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createNotificationsRepository(fastify.deps.db)
  const service = createNotificationsService(repo)
  const c = createNotificationsController(service)

  fastify.get('/', { preValidation: [requireAuth] }, c.list)
  fastify.patch('/:id/read', { preValidation: [requireAuth] }, c.markRead)
}
