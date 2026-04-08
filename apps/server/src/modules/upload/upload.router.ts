import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../hooks/auth-pre.js'
import { createUploadRepository } from './upload.repository.js'
import { createUploadService } from './upload.service.js'
import { createUploadController } from './upload.controller.js'

export const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createUploadRepository(fastify.deps.db)
  const service = createUploadService(repo)
  const c = createUploadController(service)

  fastify.post(
    '/',
    {
      preValidation: [requireAuth],
      config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
    },
    c.upload,
  )
}
