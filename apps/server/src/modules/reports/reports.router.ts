import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { requireAuth } from '../../hooks/auth-pre.js'
import { createReportsRepository } from './reports.repository.js'
import { createReportSchema } from './reports.model.js'

export const reportRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createReportsRepository(fastify.deps.db)

  fastify.post(
    '/',
    {
      preValidation: [requireAuth],
      config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createReportSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ success: false, error: 'Invalid input', code: 'VALIDATION' })
      }
      const rows = await repo.createReport({
        reporterId: request.userId!,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        reason: parsed.data.reason,
        description: parsed.data.description ?? null,
      })
      return reply.status(201).send({ success: true, data: { report: rows[0] } })
    },
  )
}
