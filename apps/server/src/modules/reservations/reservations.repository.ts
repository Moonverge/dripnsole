import { desc, eq, inArray } from 'drizzle-orm'
import { listings, reservations, stores } from '../../db/schema.js'
import type { Db } from '../../db/client.js'

export function createReservationsRepository(db: Db) {
  return {
    listAsBuyer(userId: string) {
      return db
        .select()
        .from(reservations)
        .where(eq(reservations.buyerId, userId))
        .orderBy(desc(reservations.createdAt))
        .limit(100)
    },

    selectOwnedListingIdsForUser(userId: string) {
      return db
        .select({ id: listings.id })
        .from(listings)
        .innerJoin(stores, eq(listings.storeId, stores.id))
        .where(eq(stores.userId, userId))
    },

    listAsSellerByListingIds(listingIds: string[]) {
      if (listingIds.length === 0)
        return Promise.resolve([] as (typeof reservations.$inferSelect)[])
      return db
        .select()
        .from(reservations)
        .where(inArray(reservations.listingId, listingIds))
        .orderBy(desc(reservations.createdAt))
        .limit(100)
    },

    findListingById(id: string) {
      return db.select().from(listings).where(eq(listings.id, id)).limit(1)
    },

    findStoreById(storeId: string) {
      return db.select().from(stores).where(eq(stores.id, storeId)).limit(1)
    },

    insertReservation(values: typeof reservations.$inferInsert) {
      return db.insert(reservations).values(values).returning()
    },

    setListingAvailability(listingId: string, availability: 'available' | 'reserved' | 'sold') {
      return db
        .update(listings)
        .set({ availability, updatedAt: new Date() })
        .where(eq(listings.id, listingId))
    },

    findReservationById(id: string) {
      return db.select().from(reservations).where(eq(reservations.id, id)).limit(1)
    },

    updateReservationStatus(id: string, status: typeof reservations.$inferInsert.status) {
      return db.update(reservations).set({ status }).where(eq(reservations.id, id))
    },
  }
}

export type ReservationsRepository = ReturnType<typeof createReservationsRepository>
