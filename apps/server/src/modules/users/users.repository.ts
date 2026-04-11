import { eq } from 'drizzle-orm'
import type { Db } from '../../db/client.js'
import { users } from '../../db/schema.js'

export function createUsersRepository(db: Db) {
  return {
    findById(id: string) {
      return db.select().from(users).where(eq(users.id, id)).limit(1)
    },

    updateProfile(id: string, patch: { name?: string; profilePic?: string }) {
      return db
        .update(users)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          profilePic: users.profilePic,
          role: users.role,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
        })
    },

    updatePasswordHash(id: string, passwordHash: string) {
      return db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, id))
    },
  }
}

export type UsersRepository = ReturnType<typeof createUsersRepository>
