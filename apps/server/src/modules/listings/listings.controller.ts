import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  createListingBodySchema,
  updateListingBodySchema,
  availabilityBodySchema,
  type ListingListQuery,
} from './listings.model.js'
import type { ListingsService } from './listings.service.js'

function badRequest(reply: FastifyReply) {
  return reply.status(400).send({ success: false, error: 'Invalid input', code: 'VALIDATION' })
}

function parseListQuery(request: FastifyRequest): ListingListQuery {
  const q = request.query as Record<string, string | undefined>
  const limit = Math.min(50, Math.max(1, Number(q.limit) || 20))
  return {
    limit,
    cursor: q.cursor,
    category: q.category,
    subcategory: q.subcategory,
    condition: q.condition,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    size: q.size,
    sellerBadge: q.sellerBadge,
    sort: q.sort,
  }
}

export function createListingsController(service: ListingsService) {
  return {
    async create(request: FastifyRequest, reply: FastifyReply) {
      const parsed = createListingBodySchema.safeParse(request.body)
      if (!parsed.success) return badRequest(reply)
      const out = await service.create(request.userId!, parsed.data)
      if (out.kind === 'honeypot') {
        return reply.send({
          success: true,
          data: { listing: { id: out.fakeId, title: out.title } },
        })
      }
      if (out.kind === 'validation') {
        return reply
          .status(400)
          .send({ success: false, error: out.message ?? 'Invalid input', code: 'VALIDATION' })
      }
      if (out.kind === 'forbidden') {
        return reply.status(403).send({ success: false, error: out.message, code: 'FORBIDDEN' })
      }
      if (out.kind === 'photo_attach') {
        return reply
          .status(400)
          .send({ success: false, error: 'Invalid photos', code: 'VALIDATION' })
      }
      return reply.status(201).send({ success: true, data: { listing: out.listing } })
    },

    async listPublished(request: FastifyRequest, reply: FastifyReply) {
      const data = await service.listPublished(parseListQuery(request))
      return reply.send({
        success: true,
        data: { listings: data.listings, nextCursor: data.nextCursor },
      })
    },

    async search(request: FastifyRequest, reply: FastifyReply) {
      const q = String((request.query as { q?: string }).q ?? '')
      const t = q.trim()
      if (!t) {
        return reply
          .status(400)
          .send({ success: false, error: 'Invalid input', code: 'VALIDATION' })
      }
      if (t.length > 100) {
        return reply
          .status(400)
          .send({ success: false, error: 'Invalid input', code: 'VALIDATION' })
      }
      const data = await service.search(q)
      return reply.send({ success: true, data })
    },

    async feed(request: FastifyRequest, reply: FastifyReply) {
      const data = await service.feed(request.userId!)
      return reply.send({ success: true, data })
    },

    async myListings(request: FastifyRequest, reply: FastifyReply) {
      const data = await service.myListings(request.userId!)
      return reply.send({ success: true, data })
    },

    async followingListings(request: FastifyRequest, reply: FastifyReply) {
      const data = await service.followingListings(request.userId!)
      return reply.send({ success: true, data })
    },

    async getById(request: FastifyRequest, reply: FastifyReply) {
      const out = await service.getById(String((request.params as { id: string }).id))
      if (out.kind === 'bad_id') {
        return reply.status(400).send({ success: false, error: 'Invalid id', code: 'VALIDATION' })
      }
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'Not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { listing: out.listing } })
    },

    async update(request: FastifyRequest, reply: FastifyReply) {
      const parsed = updateListingBodySchema.safeParse(request.body)
      if (!parsed.success) return badRequest(reply)
      const out = await service.update(
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
      return reply.send({ success: true, data: { listing: out.listing } })
    },

    async deleteListing(request: FastifyRequest, reply: FastifyReply) {
      const out = await service.deleteListing(
        request.userId!,
        String((request.params as { id: string }).id),
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
      return reply.send({ success: true, data: { ok: true } })
    },

    async setAvailability(request: FastifyRequest, reply: FastifyReply) {
      const body = availabilityBodySchema.safeParse(request.body)
      if (!body.success) return badRequest(reply)
      const out = await service.setAvailability(
        request.userId!,
        String((request.params as { id: string }).id),
        body.data.availability,
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
      return reply.send({ success: true, data: { availability: out.availability } })
    },

    async toggleSave(request: FastifyRequest, reply: FastifyReply) {
      const out = await service.toggleSave(
        request.userId!,
        String((request.params as { id: string }).id),
      )
      if (out.kind === 'bad_id') {
        return reply.status(400).send({ success: false, error: 'Invalid id', code: 'VALIDATION' })
      }
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'Not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { saved: out.saved } })
    },
  }
}
