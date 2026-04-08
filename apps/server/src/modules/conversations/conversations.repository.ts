import { and, desc, eq, or } from 'drizzle-orm'
import { conversations, listings, messages, stores, users } from '../../db/schema.js'
import type { Db } from '../../db/client.js'

export function createConversationsRepository(db: Db) {
  return {
    listForUser(userId: string) {
      return db
        .select()
        .from(conversations)
        .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
        .orderBy(desc(conversations.lastMessageAt))
        .limit(80)
    },

    findListingById(id: string) {
      return db.select().from(listings).where(eq(listings.id, id)).limit(1)
    },

    findStoreById(storeId: string) {
      return db.select().from(stores).where(eq(stores.id, storeId)).limit(1)
    },

    findConversationByListingAndBuyer(listingId: string, buyerId: string) {
      return db
        .select()
        .from(conversations)
        .where(and(eq(conversations.listingId, listingId), eq(conversations.buyerId, buyerId)))
        .limit(1)
    },

    insertConversation(values: typeof conversations.$inferInsert) {
      return db.insert(conversations).values(values).returning()
    },

    findConversationById(id: string) {
      return db.select().from(conversations).where(eq(conversations.id, id)).limit(1)
    },

    listMessages(conversationId: string) {
      return db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(100)
    },

    userEmailVerified(userId: string) {
      return db
        .select({ emailVerified: users.emailVerified })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
    },

    insertMessage(values: typeof messages.$inferInsert) {
      return db.insert(messages).values(values).returning()
    },

    touchConversationLastMessage(conversationId: string) {
      return db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conversationId))
    },
  }
}

export type ConversationsRepository = ReturnType<typeof createConversationsRepository>
