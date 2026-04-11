import type { FastifyReply, FastifyRequest } from 'fastify'
import { updateProfileSchema, changePasswordSchema } from './users.model.js'
import type { UsersService } from './users.service.js'

function badInput(reply: FastifyReply) {
  return reply.status(400).send({ success: false, error: 'Invalid input', code: 'VALIDATION' })
}

export function createUsersController(service: UsersService) {
  return {
    async updateProfile(request: FastifyRequest, reply: FastifyReply) {
      const parsed = updateProfileSchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.updateProfile(request.userId!, parsed.data)
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'User not found', code: 'NOT_FOUND' })
      }
      if (out.kind === 'no_changes') {
        return reply.send({ success: true, data: { ok: true } })
      }
      return reply.send({ success: true, data: { user: out.user } })
    },

    async changePassword(request: FastifyRequest, reply: FastifyReply) {
      const parsed = changePasswordSchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.changePassword(request.userId!, parsed.data)
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'User not found', code: 'NOT_FOUND' })
      }
      if (out.kind === 'wrong_password') {
        return reply.status(403).send({ success: false, error: 'Current password is incorrect', code: 'FORBIDDEN' })
      }
      return reply.send({ success: true, data: { ok: true } })
    },
  }
}
