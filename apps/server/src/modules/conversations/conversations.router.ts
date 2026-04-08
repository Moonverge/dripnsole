import type { FastifyPluginAsync } from 'fastify'
import { requireAuth, requireEmailVerified } from '../../hooks/auth-pre.js'
import { createConversationsRepository } from './conversations.repository.js'
import { createConversationsService } from './conversations.service.js'
import { createConversationsController } from './conversations.controller.js'

export const conversationRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createConversationsRepository(fastify.deps.db)
  const service = createConversationsService(repo)
  const c = createConversationsController(service)

  fastify.get(
    '/',
    { preValidation: [requireAuth], config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    c.list,
  )
  fastify.post(
    '/',
    {
      preValidation: [requireAuth, requireEmailVerified],
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    c.create,
  )
  fastify.get('/:id/messages', { preValidation: [requireAuth] }, c.listMessages)
  fastify.post(
    '/:id/messages',
    {
      preValidation: [requireAuth, requireEmailVerified],
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    c.postMessage,
  )
}
