import { eq } from 'drizzle-orm'
import { listings, reviews, stores, transactions } from '../../db/schema.js'
import type { Db } from '../../db/client.js'

export function createReviewsRepository(db: Db) {
  return {
    findTransactionById(id: string) {
      return db.select().from(transactions).where(eq(transactions.id, id)).limit(1)
    },

    findListingById(id: string) {
      return db.select().from(listings).where(eq(listings.id, id)).limit(1)
    },

    findStoreById(storeId: string) {
      return db.select().from(stores).where(eq(stores.id, storeId)).limit(1)
    },

    insertReview(values: typeof reviews.$inferInsert) {
      return db.insert(reviews).values(values).returning()
    },
  }
}

export type ReviewsRepository = ReturnType<typeof createReviewsRepository>
