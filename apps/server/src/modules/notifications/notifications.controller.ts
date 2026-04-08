import type { FastifyReply, FastifyRequest } from 'fastify'
import { parseUuidV4 } from '../../lib/uuid-v4.js'
import { NOTIFICATION_DEFAULT_LIMIT, NOTIFICATION_MAX_LIMIT } from './notifications.model.js'
import type { NotificationsService } from './notifications.service.js'

export function createNotificationsController(service: NotificationsService) {
  return {
    async list(request: FastifyRequest, reply: FastifyReply) {
      const uid = request.userId!
      const q = request.query as { limit?: string }
      const limit = Math.min(
        NOTIFICATION_MAX_LIMIT,
        Math.max(1, Number(q.limit) || NOTIFICATION_DEFAULT_LIMIT),
      )
      const data = await service.list(uid, limit)
      return reply.send({ success: true, data })
    },

    async markRead(request: FastifyRequest, reply: FastifyReply) {
      let id: string
      try {
        id = parseUuidV4(String((request.params as { id: string }).id))
      } catch {
        return reply.status(400).send({ success: false, error: 'Invalid id', code: 'VALIDATION' })
      }
      await service.markRead(request.userId!, id)
      return reply.send({ success: true, data: { ok: true } })
    },
  }
}
