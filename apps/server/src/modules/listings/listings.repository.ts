import type { SQL } from 'drizzle-orm'
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { follows, listingPhotos, listings, stores, wishlists } from '../../db/schema.js'
import type { Db } from '../../db/client.js'
import type { DbTx } from '../../db/tx.js'
import type { ListingCondition, ListingListQuery } from './listings.model.js'
import { conditionToDb } from './listings.model.js'

export function createListingsRepository(db: Db) {
  return {
    findStoreByUserId(userId: string) {
      return db.select().from(stores).where(eq(stores.userId, userId)).limit(1)
    },

    findStoreById(storeId: string) {
      return db.select().from(stores).where(eq(stores.id, storeId)).limit(1)
    },

    findListingById(id: string) {
      return db.select().from(listings).where(eq(listings.id, id)).limit(1)
    },

    findListingWithStorePublic(id: string) {
      return db
        .select({ listing: listings, store: stores })
        .from(listings)
        .innerJoin(stores, eq(listings.storeId, stores.id))
        .where(and(eq(listings.id, id), isNull(listings.deletedAt)))
        .limit(1)
    },

    findPhotosForListing(listingId: string) {
      return db.select().from(listingPhotos).where(eq(listingPhotos.listingId, listingId))
    },

    findPhotosForListings(listingIds: string[]) {
      if (listingIds.length === 0)
        return Promise.resolve([] as (typeof listingPhotos.$inferSelect)[])
      return db.select().from(listingPhotos).where(inArray(listingPhotos.listingId, listingIds))
    },

    async listPublishedPage(q: ListingListQuery) {
      const limit = q.limit
      let cursorDate: Date | null = null
      let cursorId: string | null = null
      if (q.cursor) {
        const [d, id] = q.cursor.split('_')
        if (d && id) {
          cursorDate = new Date(d)
          cursorId = id
        }
      }

      const parts: SQL[] = [isNull(listings.deletedAt), eq(listings.availability, 'available')]
      if (q.category) parts.push(eq(listings.category, q.category as 'Clothes' | 'Shoes'))
      if (q.subcategory) parts.push(eq(listings.subcategory, q.subcategory))
      if (q.condition) {
        const c = conditionToDb(q.condition as ListingCondition)
        parts.push(eq(listings.condition, c as typeof listings.$inferSelect.condition))
      }
      if (q.minPrice) parts.push(sql`${listings.price} >= ${Number(q.minPrice)}`)
      if (q.maxPrice) parts.push(sql`${listings.price} <= ${Number(q.maxPrice)}`)
      if (q.size) parts.push(eq(listings.size, q.size))
      if (q.sellerBadge) parts.push(eq(stores.badge, q.sellerBadge as 'new' | 'verified' | 'top'))

      const base = and(...parts)
      const joinWhere =
        cursorDate && cursorId
          ? and(
              base,
              sql`(${listings.createdAt}, ${listings.id}) < (${cursorDate}::timestamptz, ${cursorId}::uuid)`,
            )
          : base

      const orderSql =
        q.sort === 'price_asc'
          ? [listings.price, listings.id]
          : q.sort === 'price_desc'
            ? [desc(listings.price), desc(listings.id)]
            : q.sort === 'most_saved'
              ? [desc(listings.saveCount), desc(listings.id)]
              : [desc(listings.createdAt), desc(listings.id)]

      const rows = await db
        .select({ listing: listings, store: stores })
        .from(listings)
        .innerJoin(stores, eq(listings.storeId, stores.id))
        .where(joinWhere)
        .orderBy(...orderSql)
        .limit(limit + 1)

      return rows
    },

    searchPublished(term: string) {
      return db
        .select({ listing: listings, store: stores })
        .from(listings)
        .innerJoin(stores, eq(listings.storeId, stores.id))
        .where(
          and(
            isNull(listings.deletedAt),
            eq(listings.availability, 'available'),
            sql`listings.search_vector @@ plainto_tsquery('simple', ${term})`,
          ),
        )
        .orderBy(desc(listings.createdAt))
        .limit(40)
    },

    followedStoreIds(userId: string) {
      return db
        .select({ storeId: follows.storeId })
        .from(follows)
        .innerJoin(stores, eq(follows.storeId, stores.id))
        .where(eq(follows.followerId, userId))
    },

    followedStoreIdsOnly(userId: string) {
      return db
        .select({ storeId: follows.storeId })
        .from(follows)
        .where(eq(follows.followerId, userId))
    },

    trendingAvailable(limit: number) {
      return db
        .select({ listing: listings, store: stores })
        .from(listings)
        .innerJoin(stores, eq(listings.storeId, stores.id))
        .where(and(isNull(listings.deletedAt), eq(listings.availability, 'available')))
        .orderBy(desc(listings.saveCount), desc(listings.createdAt))
        .limit(limit)
    },

    byStoreIds(storeIds: string[], limit: number) {
      if (storeIds.length === 0)
        return Promise.resolve(
          [] as { listing: typeof listings.$inferSelect; store: typeof stores.$inferSelect }[],
        )
      return db
        .select({ listing: listings, store: stores })
        .from(listings)
        .innerJoin(stores, eq(listings.storeId, stores.id))
        .where(
          and(
            isNull(listings.deletedAt),
            eq(listings.availability, 'available'),
            inArray(listings.storeId, storeIds),
          ),
        )
        .orderBy(desc(listings.createdAt))
        .limit(limit)
    },

    byStoreId(storeId: string, limit: number) {
      return db
        .select({ listing: listings, store: stores })
        .from(listings)
        .innerJoin(stores, eq(listings.storeId, stores.id))
        .where(and(eq(listings.storeId, storeId), isNull(listings.deletedAt)))
        .orderBy(desc(listings.createdAt))
        .limit(limit)
    },

    updateListingRow(id: string, patch: Partial<typeof listings.$inferInsert>) {
      return db.update(listings).set(patch).where(eq(listings.id, id))
    },

    softDeleteListing(id: string) {
      return db
        .update(listings)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(listings.id, id))
    },

    async toggleWishlist(userId: string, listingId: string): Promise<boolean> {
      const ex = await db
        .select()
        .from(wishlists)
        .where(and(eq(wishlists.userId, userId), eq(wishlists.listingId, listingId)))
        .limit(1)
      let saved = false
      await db.transaction(async (tx) => {
        if (ex[0]) {
          await tx
            .delete(wishlists)
            .where(and(eq(wishlists.userId, userId), eq(wishlists.listingId, listingId)))
          await tx
            .update(listings)
            .set({ saveCount: sql`GREATEST(${listings.saveCount} - 1, 0)`, updatedAt: new Date() })
            .where(eq(listings.id, listingId))
          saved = false
        } else {
          await tx.insert(wishlists).values({ userId, listingId })
          await tx
            .update(listings)
            .set({ saveCount: sql`${listings.saveCount} + 1`, updatedAt: new Date() })
            .where(eq(listings.id, listingId))
          saved = true
        }
      })
      return saved
    },

    async createListingWithPhotos(
      tx: DbTx,
      input: {
        listingId: string
        storeId: string
        userId: string
        values: typeof listings.$inferInsert
        photoIds: string[]
      },
    ): Promise<void> {
      await tx.insert(listings).values(input.values)
      let i = 0
      for (const pid of input.photoIds) {
        const res = await tx
          .update(listingPhotos)
          .set({ listingId: input.listingId, order: i })
          .where(
            and(
              eq(listingPhotos.id, pid),
              isNull(listingPhotos.listingId),
              eq(listingPhotos.uploadedBy, input.userId),
            ),
          )
          .returning({ id: listingPhotos.id })
        if (!res[0]) {
          throw new Error('photo_attach_failed')
        }
        i += 1
      }
    },
  }
}

export type ListingsRepository = ReturnType<typeof createListingsRepository>
