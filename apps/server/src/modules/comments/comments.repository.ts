import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { comments, listings, stores } from '../../db/schema.js'
import type { Db } from '../../db/client.js'

export function createCommentsRepository(db: Db) {
  return {
    listForListing(listingId: string, limit: number) {
      return db
        .select({
          id: comments.id,
          listingId: comments.listingId,
          userId: comments.userId,
          parentId: comments.parentId,
          content: comments.content,
          createdAt: comments.createdAt,
        })
        .from(comments)
        .where(and(eq(comments.listingId, listingId), isNull(comments.deletedAt)))
        .orderBy(desc(comments.createdAt))
        .limit(limit)
    },

    findCommentById(id: string) {
      return db.select().from(comments).where(eq(comments.id, id)).limit(1)
    },

    findListingById(id: string) {
      return db.select().from(listings).where(eq(listings.id, id)).limit(1)
    },

    findStoreById(storeId: string) {
      return db.select().from(stores).where(eq(stores.id, storeId)).limit(1)
    },

    insertComment(values: typeof comments.$inferInsert) {
      return db
        .insert(comments)
        .values(values)
        .returning({ id: comments.id, createdAt: comments.createdAt })
    },

    incrementListingCommentCount(listingId: string) {
      return db
        .update(listings)
        .set({ commentCount: sql`${listings.commentCount} + 1`, updatedAt: new Date() })
        .where(eq(listings.id, listingId))
    },

    softDeleteComment(id: string) {
      return db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, id))
    },

    decrementListingCommentCount(listingId: string) {
      return db
        .update(listings)
        .set({
          commentCount: sql`GREATEST(${listings.commentCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(listings.id, listingId))
    },
  }
}

export type CommentsRepository = ReturnType<typeof createCommentsRepository>
