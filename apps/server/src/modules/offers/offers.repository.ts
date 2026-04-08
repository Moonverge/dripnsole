import { eq } from 'drizzle-orm'
import { listings, offers, stores } from '../../db/schema.js'
import type { Db } from '../../db/client.js'

export function createOffersRepository(db: Db) {
  return {
    findListingById(id: string) {
      return db.select().from(listings).where(eq(listings.id, id)).limit(1)
    },

    findStoreById(storeId: string) {
      return db.select().from(stores).where(eq(stores.id, storeId)).limit(1)
    },

    insertOffer(values: typeof offers.$inferInsert) {
      return db.insert(offers).values(values).returning()
    },

    findOfferById(id: string) {
      return db.select().from(offers).where(eq(offers.id, id)).limit(1)
    },

    updateOffer(id: string, patch: Partial<typeof offers.$inferInsert>) {
      return db.update(offers).set(patch).where(eq(offers.id, id))
    },
  }
}

export type OffersRepository = ReturnType<typeof createOffersRepository>
