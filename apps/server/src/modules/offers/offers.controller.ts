import type { FastifyReply, FastifyRequest } from 'fastify'
import { createOfferBodySchema, patchOfferBodySchema } from './offers.model.js'
import type { OffersService } from './offers.service.js'

function badInput(reply: FastifyReply) {
  return reply.status(400).send({ success: false, error: 'Invalid input', code: 'VALIDATION' })
}

export function createOffersController(service: OffersService) {
  return {
    async create(request: FastifyRequest, reply: FastifyReply) {
      const parsed = createOfferBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.create(request.userId!, parsed.data)
      if (out.kind === 'bad_listing_id') {
        return reply.status(400).send({ success: false, error: 'Invalid id', code: 'VALIDATION' })
      }
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'Not found', code: 'NOT_FOUND' })
      }
      if (out.kind === 'invalid_offer') {
        return reply
          .status(400)
          .send({ success: false, error: 'Invalid offer', code: 'VALIDATION' })
      }
      return reply.status(201).send({ success: true, data: { offer: out.offer } })
    },

    async patch(request: FastifyRequest, reply: FastifyReply) {
      const parsed = patchOfferBodySchema.safeParse(request.body)
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
      if (out.kind === 'conflict') {
        return reply
          .status(409)
          .send({ success: false, error: 'Offer not actionable', code: 'CONFLICT' })
      }
      return reply.send({ success: true, data: { offer: out.offer } })
    },
  }
}
