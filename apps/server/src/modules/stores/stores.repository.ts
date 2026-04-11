import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import {
  follows,
  listingPhotos,
  listings,
  socialConnections,
  storeCategories,
  stores,
  users,
} from '../../db/schema.js'
import type { Db } from '../../db/client.js'
import type { DbTx } from '../../db/tx.js'
import type { StoreCategory } from './stores.model.js'

export function createStoresRepository(db: Db) {
  return {
    findStoreIdByHandle(handle: string) {
      return db
        .select({ id: stores.id })
        .from(stores)
        .where(sql`lower(${stores.handle}) = lower(${handle})`)
        .limit(1)
    },

    findStoreByHandle(handle: string) {
      return db
        .select()
        .from(stores)
        .where(sql`lower(${stores.handle}) = lower(${handle})`)
        .limit(1)
    },

    findStoreByUserId(userId: string) {
      return db.select({ id: stores.id }).from(stores).where(eq(stores.userId, userId)).limit(1)
    },

    async createStoreWithCategories(
      tx: DbTx,
      input: {
        storeId: string
        userId: string
        handle: string
        name: string
        bio: string | null
        pickupInfo: string | null
        shippingInfo: string | null
        categories: StoreCategory[]
      },
    ) {
      await tx.insert(stores).values({
        id: input.storeId,
        userId: input.userId,
        handle: input.handle,
        name: input.name,
        bio: input.bio,
        pickupInfo: input.pickupInfo,
        shippingInfo: input.shippingInfo,
      })
      for (const c of input.categories) {
        await tx.insert(storeCategories).values({ storeId: input.storeId, category: c })
      }
      await tx
        .update(users)
        .set({ role: 'seller' as const, updatedAt: new Date() })
        .where(eq(users.id, input.userId))
    },

    listCategories(storeId: string) {
      return db
        .select({ category: storeCategories.category })
        .from(storeCategories)
        .where(eq(storeCategories.storeId, storeId))
    },

    listListingsPage(
      storeId: string,
      limit: number,
      cursorDate: Date | null,
      cursorId: string | null,
    ) {
      const whereParts = [eq(listings.storeId, storeId), isNull(listings.deletedAt)] as const
      const base = and(...whereParts)
      const whereExpr =
        cursorDate && cursorId
          ? and(
              base,
              sql`(${listings.createdAt}, ${listings.id}) < (${cursorDate}::timestamptz, ${cursorId}::uuid)`,
            )
          : base
      return db
        .select()
        .from(listings)
        .where(whereExpr)
        .orderBy(desc(listings.createdAt), desc(listings.id))
        .limit(limit + 1)
    },

    findPhotosForListingIds(ids: string[]) {
      if (ids.length === 0) return Promise.resolve([] as (typeof listingPhotos.$inferSelect)[])
      return db.select().from(listingPhotos).where(inArray(listingPhotos.listingId, ids))
    },

    updateStore(storeId: string, patch: Partial<typeof stores.$inferInsert>) {
      return db.update(stores).set(patch).where(eq(stores.id, storeId))
    },

    findFollow(followerId: string, storeId: string) {
      return db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.storeId, storeId)))
        .limit(1)
    },

    async toggleFollow(followerId: string, storeId: string): Promise<boolean> {
      const ex = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.storeId, storeId)))
        .limit(1)
      let following = false
      await db.transaction(async (tx) => {
        if (ex[0]) {
          await tx
            .delete(follows)
            .where(and(eq(follows.followerId, followerId), eq(follows.storeId, storeId)))
          await tx
            .update(stores)
            .set({
              followerCount: sql`GREATEST(${stores.followerCount} - 1, 0)`,
              updatedAt: new Date(),
            })
            .where(eq(stores.id, storeId))
          following = false
        } else {
          await tx.insert(follows).values({ followerId, storeId })
          await tx
            .update(stores)
            .set({ followerCount: sql`${stores.followerCount} + 1`, updatedAt: new Date() })
            .where(eq(stores.id, storeId))
          following = true
        }
      })
      return following
    },

    upsertSocialConnection(input: {
      userId: string
      platform: 'facebook' | 'instagram'
      accessTokenEnc: string
      refreshTokenEnc: string | null
      accountName: string | null
    }) {
      return db
        .insert(socialConnections)
        .values({
          userId: input.userId,
          platform: input.platform,
          accessTokenEnc: input.accessTokenEnc,
          refreshTokenEnc: input.refreshTokenEnc,
          accountName: input.accountName,
        })
        .onConflictDoUpdate({
          target: [socialConnections.userId, socialConnections.platform],
          set: {
            accessTokenEnc: input.accessTokenEnc,
            refreshTokenEnc: input.refreshTokenEnc,
            accountName: input.accountName,
            connectedAt: new Date(),
          },
        })
    },

    newStoreId() {
      return randomUUID()
    },
  }
}

export type StoresRepository = ReturnType<typeof createStoresRepository>
