import type { FastifyPluginAsync } from 'fastify'

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/health',
    {
      config: { public: true, skipRateLimit: true },
    },
    async (_request, reply) => {
      let dbOk = false
      try {
        await fastify.deps.pool.query('select 1 as ok')
        dbOk = true
      } catch {
        dbOk = false
      }
      return reply.send({
        success: true,
        data: {
          status: dbOk ? 'ok' : 'degraded',
          db: dbOk,
          uptimeSec: Math.floor(process.uptime()),
          version: fastify.deps.env.APP_VERSION,
        },
      })
    },
  )
}
