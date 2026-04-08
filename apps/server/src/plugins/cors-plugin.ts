import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import type { ServerEnv } from '@dripnsole/config'

export function corsPlugin(env: ServerEnv): FastifyPluginAsync {
  const allowed = new Set(env.ALLOWED_ORIGINS)
  const plugin: FastifyPluginAsync = async (fastify) => {
    await fastify.register(cors, {
      origin: (origin, cb) => {
        if (!origin) {
          cb(null, true)
          return
        }
        cb(null, allowed.has(origin))
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Client-Version'],
      maxAge: 600,
    })

    fastify.addHook('onRequest', async (request, reply) => {
      if (request.method === 'OPTIONS') return
      if (request.url.startsWith('/api/health')) return
      const origin = request.headers.origin
      if (!origin) return
      if (!allowed.has(origin)) {
        await reply.status(403).send({ success: false, error: 'Forbidden', code: 'CORS' })
      }
    })
  }

  return fp(plugin, { name: 'cors-plugin', encapsulate: false })
}
