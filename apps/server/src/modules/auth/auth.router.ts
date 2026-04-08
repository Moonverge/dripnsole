import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../hooks/auth-pre.js'
import { createAuthRepository } from './auth.repository.js'
import { createAuthService } from './auth.service.js'
import { createAuthController } from './auth.controller.js'

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createAuthRepository(fastify.deps.db)
  const service = createAuthService({
    db: fastify.deps.db,
    redis: fastify.deps.redis,
    jwtPrivate: fastify.deps.jwtPrivate,
    repo,
  })
  const c = createAuthController(service)

  fastify.post(
    '/register',
    {
      config: {
        public: true,
        rateLimit: { max: 10, timeWindow: '15 minutes' },
      },
    },
    c.register,
  )

  fastify.post(
    '/login',
    {
      config: {
        public: true,
        rateLimit: { max: 10, timeWindow: '15 minutes' },
      },
    },
    c.login,
  )

  fastify.post(
    '/refresh',
    {
      config: { public: true, rateLimit: { max: 30, timeWindow: '15 minutes' } },
    },
    c.refresh,
  )

  fastify.post(
    '/logout',
    {
      preValidation: [requireAuth],
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    c.logout,
  )

  fastify.post(
    '/verify-email',
    { config: { public: true, rateLimit: { max: 20, timeWindow: '15 minutes' } } },
    c.verifyEmail,
  )

  fastify.get('/me', { preValidation: [requireAuth] }, c.me)
}
