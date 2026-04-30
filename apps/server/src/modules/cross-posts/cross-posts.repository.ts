import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { crossPosts, listings, listingPhotos, stores } from '../../db/schema.js'
import type { Db } from '../../db/client.js'
import type { CrossPostPlatform } from './cross-posts.model.js'

export function createCrossPostsRepository(db: Db) {
  return {
    findStoreByUserId(userId: string) {
      return db.select().from(stores).where(eq(stores.userId, userId)).limit(1)
    },

    findStoreById(storeId: string) {
      return db.select().from(stores).where(eq(stores.id, storeId)).limit(1)
    },

    setMetaConnection(input: {
      storeId: string
      pageId: string
      pageName: string | null
      igUserId: string | null
      pageTokenEncrypted: string
      expiresAt: Date | null
      connectedAt: Date
    }) {
      return db
        .update(stores)
        .set({
          metaPageId: input.pageId,
          metaPageName: input.pageName,
          metaIgUserId: input.igUserId,
          metaPageTokenEncrypted: input.pageTokenEncrypted,
          metaTokenExpiresAt: input.expiresAt,
          metaConnectedAt: input.connectedAt,
          fbConnected: true,
          igConnected: Boolean(input.igUserId),
          updatedAt: new Date(),
        })
        .where(eq(stores.id, input.storeId))
    },

    clearMetaConnection(storeId: string) {
      return db
        .update(stores)
        .set({
          metaPageId: null,
          metaPageName: null,
          metaIgUserId: null,
          metaPageTokenEncrypted: null,
          metaTokenExpiresAt: null,
          metaConnectedAt: null,
          fbConnected: false,
          igConnected: false,
          updatedAt: new Date(),
        })
        .where(eq(stores.id, storeId))
    },

    findListingForSeller(input: { listingId: string; sellerId: string }) {
      return db
        .select({
          listing: listings,
          store: stores,
        })
        .from(listings)
        .innerJoin(stores, eq(stores.id, listings.storeId))
        .where(and(eq(listings.id, input.listingId), eq(stores.userId, input.sellerId)))
        .limit(1)
    },

    findPhotosForListing(listingId: string) {
      return db
        .select()
        .from(listingPhotos)
        .where(eq(listingPhotos.listingId, listingId))
        .orderBy(listingPhotos.order)
    },

    findRecentForListing(input: {
      listingId: string
      platform: CrossPostPlatform
      sinceMs: number
    }) {
      const since = new Date(Date.now() - input.sinceMs)
      return db
        .select()
        .from(crossPosts)
        .where(
          and(
            eq(crossPosts.listingId, input.listingId),
            eq(crossPosts.platform, input.platform),
            gte(crossPosts.createdAt, since),
          ),
        )
        .orderBy(desc(crossPosts.createdAt))
        .limit(1)
    },

    countSellerInWindow(sellerId: string, windowMs: number) {
      const since = new Date(Date.now() - windowMs)
      return db
        .select({ count: sql<number>`count(*)::int` })
        .from(crossPosts)
        .where(and(eq(crossPosts.sellerId, sellerId), gte(crossPosts.createdAt, since)))
    },

    insertAttempt(input: {
      id: string
      listingId: string
      storeId: string
      sellerId: string
      platform: CrossPostPlatform
      caption: string
    }) {
      return db.insert(crossPosts).values({
        id: input.id,
        listingId: input.listingId,
        storeId: input.storeId,
        sellerId: input.sellerId,
        platform: input.platform,
        caption: input.caption,
        status: 'posting',
      })
    },

    markPosted(input: {
      id: string
      remotePostId: string | null
      remoteUrl: string | null
      postedAt: Date
    }) {
      return db
        .update(crossPosts)
        .set({
          status: 'posted',
          remotePostId: input.remotePostId,
          remoteUrl: input.remoteUrl,
          postedAt: input.postedAt,
        })
        .where(eq(crossPosts.id, input.id))
    },

    markFailed(input: { id: string; error: string }) {
      return db
        .update(crossPosts)
        .set({
          status: 'failed',
          errorMessage: input.error.slice(0, 500),
        })
        .where(eq(crossPosts.id, input.id))
    },

    historyForListing(input: { listingId: string; sellerId: string }) {
      return db
        .select()
        .from(crossPosts)
        .where(
          and(eq(crossPosts.listingId, input.listingId), eq(crossPosts.sellerId, input.sellerId)),
        )
        .orderBy(desc(crossPosts.createdAt))
        .limit(50)
    },

    latestPostedForListing(input: { listingId: string; platform: CrossPostPlatform }) {
      return db
        .select()
        .from(crossPosts)
        .where(
          and(
            eq(crossPosts.listingId, input.listingId),
            eq(crossPosts.platform, input.platform),
            eq(crossPosts.status, 'posted'),
          ),
        )
        .orderBy(desc(crossPosts.createdAt))
        .limit(1)
    },
  }
}

export type CrossPostsRepository = ReturnType<typeof createCrossPostsRepository>
