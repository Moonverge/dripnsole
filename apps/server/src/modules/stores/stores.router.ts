import type { FastifyPluginAsync } from 'fastify'
import { requireAuth, requireEmailVerified, requireSeller } from '../../hooks/auth-pre.js'
import { createAuthRepository } from '../auth/auth.repository.js'
import { createAuthService } from '../auth/auth.service.js'
import { createStoresRepository } from './stores.repository.js'
import { createStoresService } from './stores.service.js'
import { createStoresController } from './stores.controller.js'

export const storeRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createStoresRepository(fastify.deps.db)
  const authRepo = createAuthRepository(fastify.deps.db)
  const authService = createAuthService({
    db: fastify.deps.db,
    redis: fastify.deps.redis,
    jwtPrivate: fastify.deps.jwtPrivate,
    repo: authRepo,
  })
  const service = createStoresService({
    db: fastify.deps.db,
    repo,
    jwtPrivate: fastify.deps.jwtPrivate,
    authService,
  })
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
  fastify.put('/:handle', { preValidation: [requireAuth, requireSeller] }, c.updateByHandle)
  fastify.post('/:handle/follow', { preValidation: [requireAuth] }, c.toggleFollow)
  fastify.get('/:handle/followers', { config: { public: true } }, c.followerCount)
  fastify.post(
    '/:handle/connect-social',
    { preValidation: [requireAuth, requireSeller] },
    c.connectSocial,
  )
}
