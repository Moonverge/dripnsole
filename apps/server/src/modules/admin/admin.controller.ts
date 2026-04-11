import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  setBadgeSchema,
  updatePlatformSettingSchema,
  updateReportSchema,
  updateUserRoleSchema,
} from './admin.model.js'
import type { AdminService } from './admin.service.js'

function badInput(reply: FastifyReply) {
  return reply.status(400).send({ success: false, error: 'Invalid input', code: 'VALIDATION' })
}

export function createAdminController(service: AdminService) {
  return {
    async overview(_request: FastifyRequest, reply: FastifyReply) {
      const out = await service.getOverviewStats()
      return reply.send({ success: true, data: out.stats })
    },

    async listUsers(request: FastifyRequest, reply: FastifyReply) {
      const q = request.query as { search?: string; role?: string; page?: string; limit?: string }
      const page = Math.max(1, Number(q.page) || 1)
      const limit = Math.min(100, Math.max(1, Number(q.limit) || 20))
      const out = await service.listUsers({ search: q.search, role: q.role, page, limit })
      return reply.send({ success: true, data: { users: out.rows, total: out.total, page, limit } })
    },

    async getUserById(request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string }
      const out = await service.getUserById(id)
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'User not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { user: out.user } })
    },

    async updateUserRole(request: FastifyRequest, reply: FastifyReply) {
      const parsed = updateUserRoleSchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const { id } = request.params as { id: string }
      const out = await service.updateUserRole(id, parsed.data.role)
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'User not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { user: out.user } })
    },

    async suspendUser(request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string }
      const out = await service.suspendUser(id)
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'User not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { user: out.user } })
    },

    async unsuspendUser(request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string }
      const out = await service.unsuspendUser(id)
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'User not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { user: out.user } })
    },

    async deleteUser(request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string }
      const out = await service.deleteUser(id)
      if (out.kind === 'not_found') {
        return reply.status(404).send({ success: false, error: 'User not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { ok: true } })
    },

    async listListings(request: FastifyRequest, reply: FastifyReply) {
      const q = request.query as { search?: string; page?: string; limit?: string }
      const page = Math.max(1, Number(q.page) || 1)
      const limit = Math.min(100, Math.max(1, Number(q.limit) || 20))
      const out = await service.listListings({ search: q.search, page, limit })
      return reply.send({
        success: true,
        data: { listings: out.rows, total: out.total, page, limit },
      })
    },

    async softDeleteListing(request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string }
      const body = (request.body as { reason?: string }) ?? {}
      const out = await service.softDeleteListing(id, body.reason ?? 'Admin removal')
      if (out.kind === 'not_found') {
        return reply
          .status(404)
          .send({ success: false, error: 'Listing not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { ok: true } })
    },

    async listStores(request: FastifyRequest, reply: FastifyReply) {
      const q = request.query as { search?: string; page?: string; limit?: string }
      const page = Math.max(1, Number(q.page) || 1)
      const limit = Math.min(100, Math.max(1, Number(q.limit) || 20))
      const out = await service.listStores({ search: q.search, page, limit })
      return reply.send({
        success: true,
        data: { stores: out.rows, total: out.total, page, limit },
      })
    },

    async updateStoreBadge(request: FastifyRequest, reply: FastifyReply) {
      const parsed = setBadgeSchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const { id } = request.params as { id: string }
      const out = await service.updateStoreBadge(id, parsed.data.badge)
      if (out.kind === 'not_found') {
        return reply
          .status(404)
          .send({ success: false, error: 'Store not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { store: out.store } })
    },

    async suspendStore(request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string }
      await service.suspendStore(id)
      return reply.send({ success: true, data: { ok: true } })
    },

    async listReports(request: FastifyRequest, reply: FastifyReply) {
      const q = request.query as { status?: string; page?: string; limit?: string }
      const page = Math.max(1, Number(q.page) || 1)
      const limit = Math.min(100, Math.max(1, Number(q.limit) || 20))
      const out = await service.listReports({ status: q.status, page, limit })
      return reply.send({
        success: true,
        data: { reports: out.rows, total: out.total, page, limit },
      })
    },

    async updateReportStatus(request: FastifyRequest, reply: FastifyReply) {
      const parsed = updateReportSchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const { id } = request.params as { id: string }
      const out = await service.updateReportStatus(id, parsed.data.status)
      if (out.kind === 'not_found') {
        return reply
          .status(404)
          .send({ success: false, error: 'Report not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { report: out.report } })
    },

    async getPlatformSettings(_request: FastifyRequest, reply: FastifyReply) {
      const out = await service.getPlatformSettings()
      return reply.send({ success: true, data: { settings: out.settings } })
    },

    async updatePlatformSetting(request: FastifyRequest, reply: FastifyReply) {
      const parsed = updatePlatformSettingSchema.safeParse(request.body)
      if (!parsed.success) return badInput(reply)
      const { key } = request.params as { key: string }
      const out = await service.updatePlatformSetting(key, parsed.data.value)
      if (out.kind === 'not_found') {
        return reply
          .status(404)
          .send({ success: false, error: 'Setting not found', code: 'NOT_FOUND' })
      }
      return reply.send({ success: true, data: { setting: out.setting } })
    },
  }
}
