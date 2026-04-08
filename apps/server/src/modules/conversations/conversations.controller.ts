import type { FastifyReply, FastifyRequest } from 'fastify'
import { createConversationBodySchema, messageBodySchema } from './conversations.model.js'
import type { ConversationsService } from './conversations.service.js'

function badInput(reply: FastifyReply) {
  return reply.status(400).send({ success: false, error: 'Invalid input', code: 'VALIDATION' })
}

export function createConversationsController(service: ConversationsService) {
  return {
    async list(request: FastifyRequest, reply: FastifyReply) {
      const data = await service.list(request.userId!)
      return reply.send({ success: true, data })
    },

    async create(request: FastifyRequest, reply: FastifyReply) {
      const parsed = createConversationBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.create(request.userId!, parsed.data)
      if (out.kind === 'bad_id') {
        return reply.status(400).send({ success: false, error: 'Invalid id', code: 'VALIDATION' })
      }
      if (out.kind === 'invalid_recipient') {
        return reply
          .status(400)
          .send({ success: false, error: 'Invalid recipient', code: 'VALIDATION' })
      }
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'Not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { conversation: out.conversation } })
    },

    async listMessages(request: FastifyRequest, reply: FastifyReply) {
      const out = await service.listMessages(
        request.userId!,
        String((request.params as { id: string }).id),
      )
      if (out.kind === 'bad_id') {
        return reply.status(400).send({ success: false, error: 'Invalid id', code: 'VALIDATION' })
      }
      if (out.kind === 'forbidden') {
        return reply.status(403).send({ success: false, error: 'Forbidden', code: 'FORBIDDEN' })
      }
      return reply.send({ success: true, data: { messages: out.messages } })
    },

    async postMessage(request: FastifyRequest, reply: FastifyReply) {
      const parsed = messageBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.postMessage(
        request.userId!,
        String((request.params as { id: string }).id),
        parsed.data,
      )
      if (out.kind === 'bad_id') {
        return reply.status(400).send({ success: false, error: 'Invalid id', code: 'VALIDATION' })
      }
      if (out.kind === 'forbidden') {
        return reply.status(403).send({ success: false, error: 'Forbidden', code: 'FORBIDDEN' })
      }
      if (out.kind === 'email_not_verified') {
        return reply
          .status(403)
          .send({ success: false, error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' })
      }
      return reply.send({ success: true, data: { message: out.message } })
    },
  }
}
