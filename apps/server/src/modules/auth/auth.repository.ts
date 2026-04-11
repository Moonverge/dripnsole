import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { refreshTokens, storeCategories, stores, users } from '../../db/schema.js'
import type { Db } from '../../db/client.js'
import type { DbTx } from '../../db/tx.js'

export function createAuthRepository(db: Db) {
  return {
    insertUserReturning(input: {
      email: string
      passwordHash: string
      name: string
      emailVerificationTokenHash: string
      emailVerificationExpiresAt: Date
    }) {
      return db
        .insert(users)
        .values({
          email: input.email,
          passwordHash: input.passwordHash,
          name: input.name,
          emailVerified: false,
          emailVerificationTokenHash: input.emailVerificationTokenHash,
          emailVerificationExpiresAt: input.emailVerificationExpiresAt,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
        })
    },

    findUserByEmail(email: string) {
      return db.select().from(users).where(eq(users.email, email)).limit(1)
    },

    findUserById(id: string) {
      return db.select().from(users).where(eq(users.id, id)).limit(1)
    },

    findUserByVerificationHash(h: string) {
      return db.select().from(users).where(eq(users.emailVerificationTokenHash, h)).limit(1)
    },

    markEmailVerified(userId: string) {
      return db
        .update(users)
        .set({
          emailVerified: true,
          emailVerificationTokenHash: null,
          emailVerificationExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
    },

    insertRefreshToken(values: typeof refreshTokens.$inferInsert) {
      return db.insert(refreshTokens).values(values)
    },

    findRefreshByHash(tokenHash: string) {
      return db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash)).limit(1)
    },

    invalidateRefreshFamily(familyId: string) {
      return db
        .update(refreshTokens)
        .set({ invalidatedAt: new Date() })
        .where(eq(refreshTokens.familyId, familyId))
    },

    markRefreshReplaced(tx: DbTx, id: string) {
      return tx
        .update(refreshTokens)
        .set({ replacedAt: new Date() })
        .where(eq(refreshTokens.id, id))
    },

    insertRefreshInTx(tx: DbTx, values: typeof refreshTokens.$inferInsert) {
      return tx.insert(refreshTokens).values(values)
    },

    invalidateRefreshByHash(tokenHash: string) {
      return db
        .update(refreshTokens)
        .set({ invalidatedAt: new Date() })
        .where(eq(refreshTokens.tokenHash, tokenHash))
    },

    findStoreByUserId(userId: string) {
      return db.select().from(stores).where(eq(stores.userId, userId)).limit(1)
    },

    listStoreCategories(storeId: string) {
      return db
        .select({ category: storeCategories.category })
        .from(storeCategories)
        .where(eq(storeCategories.storeId, storeId))
    },

    newFamilyId() {
      return randomUUID()
    },
  }
}

export type AuthRepository = ReturnType<typeof createAuthRepository>
