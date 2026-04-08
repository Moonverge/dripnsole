import type { FastifyReply, FastifyRequest } from 'fastify'
import { createReservationBodySchema, patchReservationBodySchema } from './reservations.model.js'
import type { ReservationsService } from './reservations.service.js'

function badInput(reply: FastifyReply) {
  return reply.status(400).send({ success: false, error: 'Invalid input', code: 'VALIDATION' })
}

export function createReservationsController(service: ReservationsService) {
  return {
    async list(request: FastifyRequest, reply: FastifyReply) {
      const data = await service.listForUser(request.userId!)
      return reply.send({ success: true, data })
    },

    async create(request: FastifyRequest, reply: FastifyReply) {
      const parsed = createReservationBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.create(request.userId!, parsed.data)
      if (out.kind === 'bad_id') {
        return reply.status(400).send({ success: false, error: 'Invalid id', code: 'VALIDATION' })
      }
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'Not found', code: 'NOT_FOUND' })
      }
      if (out.kind === 'invalid') {
        return reply
          .status(400)
          .send({ success: false, error: 'Invalid reservation', code: 'VALIDATION' })
      }
      if (out.kind === 'conflict') {
        return reply
          .status(409)
          .send({ success: false, error: 'Listing already reserved', code: 'CONFLICT' })
      }
      return reply.status(201).send({ success: true, data: { reservation: out.reservation } })
    },

    async patch(request: FastifyRequest, reply: FastifyReply) {
      const parsed = patchReservationBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.patch(
        request.userId!,
        String((request.params as { id: string }).id),
        parsed.data,
      )
      if (out.kind === 'bad_id') {
        return reply.status(400).send({ success: false, error: 'Invalid id', code: 'VALIDATION' })
      }
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'Not found', code: 'NOT_FOUND' })
      }
      if (out.kind === 'forbidden') {
        return reply.status(403).send({ success: false, error: 'Forbidden', code: 'FORBIDDEN' })
      }
      return reply.send({ success: true, data: { reservation: out.reservation } })
    },
  }
}
