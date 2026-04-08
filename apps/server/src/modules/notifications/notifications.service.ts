import type { NotificationsRepository } from './notifications.repository.js'

export function createNotificationsService(repo: NotificationsRepository) {
  return {
    async list(userId: string, limit: number) {
      const rows = await repo.listByUser(userId, limit)
      const unreadCount = rows.filter((r) => !r.read).length
      return { notifications: rows, unreadCount }
    },

    async markRead(userId: string, id: string) {
      await repo.markRead(userId, id)
      return { ok: true as const }
    },
  }
}

export type NotificationsService = ReturnType<typeof createNotificationsService>
