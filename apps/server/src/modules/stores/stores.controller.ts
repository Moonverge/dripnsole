import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  REFRESH_COOKIE,
  REFRESH_TTL_MS,
} from '../auth/auth.model.js'
import {
  connectSocialBodySchema,
  createStoreBodySchema,
  updateStoreBodySchema,
} from './stores.model.js'
import type { StoresService } from './stores.service.js'

function badInput(reply: FastifyReply) {
  return reply.status(400).send({ success: false, error: 'Invalid input', code: 'VALIDATION' })
}

function setRefreshCookie(reply: FastifyReply, env: { NODE_ENV?: string }, raw: string) {
  const secure = env.NODE_ENV === 'production'
  const sameSite = secure ? ('strict' as const) : ('lax' as const)
  reply.setCookie(REFRESH_COOKIE, raw, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: Math.floor(REFRESH_TTL_MS / 1000),
  })
}

export function createStoresController(service: StoresService) {
  return {
    async checkHandle(request: FastifyRequest, reply: FastifyReply) {
      const raw = String((request.params as { handle: string }).handle || '')
      const { available } = await service.checkHandleAvailability(raw)
      return reply.send({ success: true, data: { available } })
    },

    async create(request: FastifyRequest, reply: FastifyReply) {
      const parsed = createStoreBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.create(request.userId!, parsed.data)
      if (out.kind === 'honeypot') {
        return reply.send({ success: true, data: { store: out.store } })
      }
      if (out.kind === 'bad_handle') {
        return reply
          .status(400)
          .send({ success: false, error: 'Invalid handle', code: 'VALIDATION' })
      }
      if (out.kind === 'handle_taken') {
        return reply.status(409).send({ success: false, error: 'Handle taken', code: 'CONFLICT' })
      }
      if (out.kind === 'already_has_store') {
        return reply
          .status(409)
          .send({ success: false, error: 'Store already exists', code: 'CONFLICT' })
      }
      setRefreshCookie(reply, request.server.deps.env, out.refreshRaw)
      return reply.status(201).send({
        success: true,
        data: { store: out.store, accessToken: out.accessToken },
      })
    },

    async getByHandle(request: FastifyRequest, reply: FastifyReply) {
      const handle = String((request.params as { handle: string }).handle)
      const out = await service.getPublicByHandle(
        handle,
        request.query as { cursor?: string; limit?: string },
      )
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'Not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: out.data })
    },

    async updateByHandle(request: FastifyRequest, reply: FastifyReply) {
      const parsed = updateStoreBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.updateByHandle(
        request.userId!,
        String((request.params as { handle: string }).handle),
        parsed.data,
      )
      if (out.kind === 'forbidden') {
        return reply.status(403).send({ success: false, error: 'Forbidden', code: 'FORBIDDEN' })
      }
      return reply.send({ success: true, data: { ok: true } })
    },

    async toggleFollow(request: FastifyRequest, reply: FastifyReply) {
      const out = await service.toggleFollowByHandle(
        request.userId!,
        String((request.params as { handle: string }).handle),
      )
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'Not found', code: 'NOT_FOUND' })
      }
      if (out.kind === 'cannot_follow_own') {
        return reply
          .status(400)
          .send({ success: false, error: 'Invalid follow', code: 'VALIDATION' })
      }
      return reply.send({ success: true, data: { following: out.following } })
    },

    async followerCount(request: FastifyRequest, reply: FastifyReply) {
      const out = await service.followerCountByHandle(
        String((request.params as { handle: string }).handle),
      )
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'Not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { count: out.count } })
    },

    async connectSocial(request: FastifyRequest, reply: FastifyReply) {
      const parsed = connectSocialBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.connectSocial(
        request.userId!,
        String((request.params as { handle: string }).handle),
        parsed.data,
        request.server.deps.env,
      )
      if (out.kind === 'forbidden') {
        return reply.status(403).send({ success: false, error: 'Forbidden', code: 'FORBIDDEN' })
      }
      return reply.send({ success: true, data: { ok: true } })
    },
  }
}
