import type { FastifyPluginAsync } from 'fastify'
import { requireAuth, requireEmailVerified } from '../../hooks/auth-pre.js'
import { createStoresRepository } from './stores.repository.js'
import { createStoresService } from './stores.service.js'
import { createStoresController } from './stores.controller.js'

export const storeRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createStoresRepository(fastify.deps.db)
  const service = createStoresService({ db: fastify.deps.db, repo })
  const c = createStoresController(service)

  fastify.get('/check-handle/:handle', { config: { public: true } }, c.checkHandle)

  fastify.post(
    '/',
    {
      preValidation: [requireAuth, requireEmailVerified],
      config: { rateLimit: { max: 30, timeWindow: '1 hour' } },
    },
    c.create,
  )

  fastify.get('/:handle', { config: { public: true } }, c.getByHandle)
  fastify.put('/:handle', { preValidation: [requireAuth] }, c.updateByHandle)
  fastify.post('/:handle/follow', { preValidation: [requireAuth] }, c.toggleFollow)
  fastify.get('/:handle/followers', { config: { public: true } }, c.followerCount)
  fastify.post('/:handle/connect-social', { preValidation: [requireAuth] }, c.connectSocial)
}
