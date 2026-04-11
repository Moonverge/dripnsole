import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../hooks/auth-pre.js'
import { createUsersRepository } from './users.repository.js'
import { createUsersService } from './users.service.js'
import { createUsersController } from './users.controller.js'

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createUsersRepository(fastify.deps.db)
  const service = createUsersService(repo)
  const c = createUsersController(service)

  fastify.put('/me', { preValidation: [requireAuth] }, c.updateProfile)
  fastify.post('/me/change-password', { preValidation: [requireAuth] }, c.changePassword)
}
