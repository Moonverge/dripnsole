import type { AdminRepository } from './admin.repository.js'

export function createAdminService(repo: AdminRepository) {
  return {
    async getOverviewStats() {
      const stats = await repo.getOverviewStats()
      return { kind: 'ok' as const, stats }
    },

    async listUsers(opts: { search?: string; role?: string; page: number; limit: number }) {
      const { rows, total } = await repo.listUsers(opts)
      return { kind: 'ok' as const, rows, total }
    },

    async getUserById(id: string) {
      const rows = await repo.getUserById(id)
      if (!rows[0]) return { kind: 'not_found' as const }
      return { kind: 'ok' as const, user: rows[0] }
    },

    async updateUserRole(id: string, role: 'buyer' | 'seller') {
      const rows = await repo.updateUserRole(id, role)
      if (!rows[0]) return { kind: 'not_found' as const }
      return { kind: 'ok' as const, user: rows[0] }
    },

    async suspendUser(id: string) {
      const rows = await repo.suspendUser(id)
      if (!rows[0]) return { kind: 'not_found' as const }
      return { kind: 'ok' as const, user: rows[0] }
    },

    async unsuspendUser(id: string) {
      const rows = await repo.unsuspendUser(id)
      if (!rows[0]) return { kind: 'not_found' as const }
      return { kind: 'ok' as const, user: rows[0] }
    },

    async deleteUser(id: string) {
      const rows = await repo.deleteUser(id)
      if (!rows[0]) return { kind: 'not_found' as const }
      return { kind: 'ok' as const }
    },

    async listListings(opts: { search?: string; page: number; limit: number }) {
      const { rows, total } = await repo.listListings(opts)
      return { kind: 'ok' as const, rows, total }
    },

    async softDeleteListing(id: string, reason: string) {
      const rows = await repo.softDeleteListing(id, reason)
      if (!rows[0]) return { kind: 'not_found' as const }
      return { kind: 'ok' as const }
    },

    async listStores(opts: { search?: string; page: number; limit: number }) {
      const { rows, total } = await repo.listStores(opts)
      return { kind: 'ok' as const, rows, total }
    },

    async updateStoreBadge(storeId: string, badge: 'new' | 'verified' | 'top') {
      const rows = await repo.updateStoreBadge(storeId, badge)
      if (!rows[0]) return { kind: 'not_found' as const }
      return { kind: 'ok' as const, store: rows[0] }
    },

    async suspendStore(storeId: string) {
      await repo.suspendStore(storeId)
      return { kind: 'ok' as const }
    },

    async listReports(opts: { status?: string; page: number; limit: number }) {
      const { rows, total } = await repo.listReports(opts)
      return { kind: 'ok' as const, rows, total }
    },

    async updateReportStatus(id: string, status: 'resolved' | 'dismissed') {
      const rows = await repo.updateReportStatus(id, status)
      if (!rows[0]) return { kind: 'not_found' as const }
      return { kind: 'ok' as const, report: rows[0] }
    },

    async getPlatformSettings() {
      const rows = await repo.getPlatformSettings()
      return { kind: 'ok' as const, settings: rows }
    },

    async updatePlatformSetting(key: string, value: unknown) {
      const rows = await repo.updatePlatformSetting(key, value)
      if (!rows[0]) return { kind: 'not_found' as const }
      return { kind: 'ok' as const, setting: rows[0] }
    },
  }
}

export type AdminService = ReturnType<typeof createAdminService>
