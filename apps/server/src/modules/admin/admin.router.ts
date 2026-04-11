import type { FastifyPluginAsync } from 'fastify'
import { requireAdmin, requireAuth } from '../../hooks/auth-pre.js'
import { createAdminRepository } from './admin.repository.js'
import { createAdminService } from './admin.service.js'
import { createAdminController } from './admin.controller.js'

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = createAdminRepository(fastify.deps.db)
  const service = createAdminService(repo)
  const c = createAdminController(service)

  const guard = { preValidation: [requireAuth, requireAdmin] }

  fastify.get('/overview', guard, c.overview)

  fastify.get('/users', guard, c.listUsers)
  fastify.get('/users/:id', guard, c.getUserById)
  fastify.patch('/users/:id/role', guard, c.updateUserRole)
  fastify.post('/users/:id/suspend', guard, c.suspendUser)
  fastify.post('/users/:id/unsuspend', guard, c.unsuspendUser)
  fastify.delete('/users/:id', guard, c.deleteUser)

  fastify.get('/listings', guard, c.listListings)
  fastify.delete('/listings/:id', guard, c.softDeleteListing)

  fastify.get('/stores', guard, c.listStores)
  fastify.patch('/stores/:id/badge', guard, c.updateStoreBadge)
  fastify.post('/stores/:id/suspend', guard, c.suspendStore)

  fastify.get('/reports', guard, c.listReports)
  fastify.patch('/reports/:id', guard, c.updateReportStatus)

  fastify.get('/settings', guard, c.getPlatformSettings)
  fastify.put('/settings/:key', guard, c.updatePlatformSetting)
}
