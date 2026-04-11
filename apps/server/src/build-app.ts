import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import type { ServerEnv } from '@dripnsole/config'
import type { KeyLike } from 'jose'
import type { RedisClient } from './redis/client.js'
import { createDbPool, type Pool } from './db/client.js'
import type { AppDeps } from './app-deps.js'
import { requestContextPlugin } from './plugins/request-context.js'
import { securityHeadersPlugin } from './plugins/security-headers.js'
import { corsPlugin } from './plugins/cors-plugin.js'
import { requireClientVersion } from './hooks/client-version.js'
import { HttpError } from './lib/http-error.js'
import { healthRoutes } from './routes/health.js'
import { authRoutes } from './modules/auth/auth.router.js'
import { storeRoutes } from './modules/stores/stores.router.js'
import { listingRoutes } from './modules/listings/listings.router.js'
import { commentRoutes } from './modules/comments/comments.router.js'
import { uploadRoutes } from './modules/upload/upload.router.js'
import { conversationRoutes } from './modules/conversations/conversations.router.js'
import { offerRoutes } from './modules/offers/offers.router.js'
import { reservationRoutes } from './modules/reservations/reservations.router.js'
import { notificationRoutes } from './modules/notifications/notifications.router.js'
import { reviewRoutes } from './modules/reviews/reviews.router.js'
import { adminRoutes } from './modules/admin/admin.router.js'
import { userRoutes } from './modules/users/users.router.js'
import { reportRoutes } from './modules/reports/reports.router.js'

export async function buildApp(input: {
  env: ServerEnv
  jwtPrivate: KeyLike
  jwtPublic: KeyLike
  redis: RedisClient | null
}): Promise<{ fastify: ReturnType<typeof Fastify>; deps: AppDeps; pool: Pool }> {
  const { pool, db } = createDbPool(input.env)
  const deps: AppDeps = {
    env: input.env,
    db,
    pool,
    redis: input.redis,
    jwtPrivate: input.jwtPrivate,
    jwtPublic: input.jwtPublic,
  }

  const fastify = Fastify({
    logger: { level: input.env.NODE_ENV === 'production' ? 'info' : 'debug' },
    bodyLimit: 1024 * 1024,
    requestIdHeader: false,
  })

  fastify.decorate('deps', deps)

  fastify.setErrorHandler((err, request, reply) => {
    if (reply.sent) return
    if (err instanceof HttpError) {
      if (err.headers) {
        for (const [k, v] of Object.entries(err.headers)) reply.header(k, v)
      }
      return reply.status(err.statusCode).send({
        success: false,
        error: err.message,
        code: err.code,
      })
    }
    const status = typeof err.statusCode === 'number' ? err.statusCode : 500
    if (status === 429) {
      return reply.status(429).send({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT',
      })
    }
    request.log.warn({ err, requestId: request.requestId }, 'request_failed')
    const message =
      input.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message || 'Error'
    return reply.status(status >= 400 && status < 600 ? status : 500).send({
      success: false,
      error: message,
      code: 'INTERNAL',
    })
  })

  await fastify.register(requestContextPlugin)
  await fastify.register(securityHeadersPlugin(input.env))
  await fastify.register(corsPlugin(input.env))
  await fastify.register(cookie)
  await fastify.register(multipart, {
    limits: { files: 20, fileSize: 25 * 1024 * 1024 },
  })

  await fastify.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: '15 minutes',
    redis: input.env.NODE_ENV === 'test' ? undefined : (input.redis ?? undefined),
    skipOnError: input.env.NODE_ENV !== 'test',
    keyGenerator: (request: import('fastify').FastifyRequest) => {
      if (input.env.NODE_ENV === 'test' && request.headers['x-ratelimit-test'] !== '1') {
        return `test:${request.id}`
      }
      return request.ip
    },
    addHeaders: { 'retry-after': true },
    errorResponseBuilder: (
      _request: import('fastify').FastifyRequest,
      context: { ttl: number; statusCode?: number },
    ) => {
      const err = new Error('Too many requests') as Error & { statusCode: number }
      err.statusCode = context.statusCode ?? 429
      return err
    },
  } as import('fastify').FastifyRegisterOptions<unknown>)

  fastify.addHook('preHandler', requireClientVersion)

  await fastify.register(
    async (f) => {
      await f.register(healthRoutes)
      await f.register(authRoutes, { prefix: '/auth' })
      await f.register(storeRoutes, { prefix: '/stores' })
      await f.register(listingRoutes, { prefix: '/listings' })
      await f.register(commentRoutes)
      await f.register(uploadRoutes, { prefix: '/upload' })
      await f.register(conversationRoutes, { prefix: '/conversations' })
      await f.register(offerRoutes, { prefix: '/offers' })
      await f.register(reservationRoutes, { prefix: '/reservations' })
      await f.register(notificationRoutes, { prefix: '/notifications' })
      await f.register(reviewRoutes, { prefix: '/reviews' })
      await f.register(adminRoutes, { prefix: '/admin' })
      await f.register(userRoutes, { prefix: '/users' })
      await f.register(reportRoutes, { prefix: '/reports' })
    },
    { prefix: '/api' },
  )

  fastify.addHook('onResponse', (request, reply, done) => {
    if (reply.statusCode === 429) {
      request.log.warn(
        {
          requestId: request.requestId,
          statusCode: 429,
          path: request.url,
          userId: request.userId,
        },
        'rate_limit_hit',
      )
    }
    done()
  })

  return { fastify, deps, pool }
}
