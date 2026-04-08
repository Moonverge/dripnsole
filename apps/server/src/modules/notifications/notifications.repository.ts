import { and, desc, eq } from 'drizzle-orm'
import { notifications } from '../../db/schema.js'
import type { Db } from '../../db/client.js'

export function createNotificationsRepository(db: Db) {
  return {
    listByUser(userId: string, limit: number) {
      return db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
    },

    markRead(userId: string, id: string) {
      return db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    },
  }
}

export type NotificationsRepository = ReturnType<typeof createNotificationsRepository>
