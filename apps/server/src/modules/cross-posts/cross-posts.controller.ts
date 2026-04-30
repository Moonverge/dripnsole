import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  bulkCrossPostBodySchema,
  singleCrossPostBodySchema,
  soldCrossPostBodySchema,
} from './cross-posts.model.js'
import type { CrossPostsService } from './cross-posts.service.js'

function badInput(reply: FastifyReply, message = 'Invalid input') {
  return reply.status(400).send({ success: false, error: message, code: 'VALIDATION' })
}

export function createCrossPostsController(service: CrossPostsService) {
  return {
    async metaOAuthUrl(request: FastifyRequest, reply: FastifyReply) {
      const out = await service.getMetaOAuthUrl(request.userId!)
      if (out.kind === 'no_store') {
        return reply
          .status(404)
          .send({ success: false, error: 'Store not found', code: 'NOT_FOUND' })
      }
      if (out.kind === 'not_configured') {
        return reply.status(503).send({
          success: false,
          error: 'Facebook connection is not configured on the server.',
          code: 'META_NOT_CONFIGURED',
        })
      }
      return reply.send({ success: true, data: { url: out.url } })
    },

    async metaCallback(request: FastifyRequest, reply: FastifyReply) {
      const q = request.query as {
        code?: string
        state?: string
        error?: string
        error_description?: string
      }
      const env = request.server.deps.env
      const settingsPath = `${env.FRONTEND_URL.replace(/\/$/, '')}/dashboard/settings`

      if (q.error) {
        const msg = encodeURIComponent(q.error_description ?? q.error)
        return reply.redirect(`${settingsPath}?meta_error=${msg}`)
      }
      if (!q.code?.trim() || !q.state?.trim()) {
        return reply.redirect(
          `${settingsPath}?meta_error=${encodeURIComponent('Missing OAuth response')}`,
        )
      }

      const out = await service
        .completeMetaOAuth({
          code: q.code.trim(),
          state: q.state.trim(),
        })
        .catch((e) => ({
          kind: 'failed' as const,
          message: e instanceof Error ? e.message : 'Connection failed',
        }))

      if (out.kind !== 'ok') {
        const msg =
          out.kind === 'bad_state'
            ? 'Login session expired. Try again.'
            : out.kind === 'forbidden'
              ? 'Could not verify your store.'
              : out.kind === 'no_pages'
                ? 'No Facebook Page found. Create a Page and retry.'
                : out.message
        return reply.redirect(`${settingsPath}?meta_error=${encodeURIComponent(msg)}`)
      }

      return reply.redirect(`${settingsPath}?meta_connected=1`)
    },

    async getMetaConnection(request: FastifyRequest, reply: FastifyReply) {
      const out = await service.getMetaConnection(request.userId!)
      if (out.kind === 'no_store') {
        return reply
          .status(404)
          .send({ success: false, error: 'Store not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: out.data })
    },

    async clearMetaConnection(request: FastifyRequest, reply: FastifyReply) {
      const out = await service.clearMetaConnection(request.userId!)
      if (out.kind === 'no_store') {
        return reply
          .status(404)
          .send({ success: false, error: 'Store not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { ok: true } })
    },

    async singlePost(request: FastifyRequest, reply: FastifyReply) {
      const parsed = singleCrossPostBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const listingId = String((request.params as { id: string }).id)
      const out = await service.crossPostSingle({
        sellerId: request.userId!,
        listingId,
        body: parsed.data,
      })
      if (out.kind === 'not_found') {
        return reply
          .status(404)
          .send({ success: false, error: 'Listing not found', code: 'NOT_FOUND' })
      }
      if (out.kind === 'not_connected') {
        return reply.status(400).send({
          success: false,
          error: 'Connect Meta in Settings first.',
          code: 'NOT_CONNECTED',
        })
      }
      if (out.kind === 'no_photos') {
        return reply.status(400).send({
          success: false,
          error: 'Listing needs at least one photo.',
          code: 'NO_PHOTOS',
        })
      }
      if (out.kind === 'rate_limited') {
        return reply.status(429).send({ success: false, error: out.message, code: out.code })
      }
      return reply.send({ success: true, data: { outcomes: out.outcomes } })
    },

    async bulkPost(request: FastifyRequest, reply: FastifyReply) {
      const parsed = bulkCrossPostBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const out = await service.crossPostBulk({
        sellerId: request.userId!,
        body: parsed.data,
      })
      if (out.kind === 'not_found') {
        return reply
          .status(404)
          .send({ success: false, error: 'Store not found', code: 'NOT_FOUND' })
      }
      if (out.kind === 'not_connected') {
        return reply.status(400).send({
          success: false,
          error: 'Connect Meta in Settings first.',
          code: 'NOT_CONNECTED',
        })
      }
      return reply.send({
        success: true,
        data: { accepted: out.accepted, rejected: out.rejected },
      })
    },

    async sold(request: FastifyRequest, reply: FastifyReply) {
      const parsed = soldCrossPostBodySchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const listingId = String((request.params as { id: string }).id)
      const out = await service.markSold({
        sellerId: request.userId!,
        listingId,
        body: parsed.data,
      })
      if (out.kind === 'not_found') {
        return reply
          .status(404)
          .send({ success: false, error: 'Listing not found', code: 'NOT_FOUND' })
      }
      if (out.kind === 'not_connected') {
        return reply.status(400).send({
          success: false,
          error: 'Connect Meta in Settings first.',
          code: 'NOT_CONNECTED',
        })
      }
      if (out.kind === 'nothing_to_update') {
        return reply.send({ success: true, data: { updated: 0 } })
      }
      if (out.kind === 'failed') {
        return reply
          .status(502)
          .send({ success: false, error: out.message, code: 'META_FAILED' })
      }
      return reply.send({ success: true, data: out.data })
    },

    async history(request: FastifyRequest, reply: FastifyReply) {
      const listingId = String((request.params as { id: string }).id)
      const data = await service.historyForListing({
        sellerId: request.userId!,
        listingId,
      })
      return reply.send({ success: true, data: { crossPosts: data } })
    },
  }
}
