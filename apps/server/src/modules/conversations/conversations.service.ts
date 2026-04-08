import { sanitizePlainText } from '../../lib/sanitize-text.js'
import { parseUuidV4 } from '../../lib/uuid-v4.js'
import type { ConversationsRepository } from './conversations.repository.js'
import type { CreateConversationBody, MessageBody } from './conversations.model.js'

export function createConversationsService(repo: ConversationsRepository) {
  return {
    async list(userId: string) {
      const rows = await repo.listForUser(userId)
      return { conversations: rows }
    },

    async create(buyerId: string, body: CreateConversationBody) {
      let listingId: string
      let recipientId: string
      try {
        listingId = parseUuidV4(body.listing_id)
        recipientId = parseUuidV4(body.recipient_id)
      } catch {
        return { kind: 'bad_id' as const }
      }
      if (recipientId === buyerId) {
        return { kind: 'invalid_recipient' as const }
      }
      const lrows = await repo.findListingById(listingId)
      const listing = lrows[0]
      if (!listing || listing.deletedAt) {
        return { kind: 'not_found' as const }
      }
      const srows = await repo.findStoreById(listing.storeId)
      const store = srows[0]
      if (!store) {
        return { kind: 'not_found' as const }
      }
      const sellerId = store.userId
      if (buyerId === sellerId) {
        return { kind: 'invalid_recipient' as const }
      }
      if (recipientId !== sellerId) {
        return { kind: 'invalid_recipient' as const }
      }
      const ex = await repo.findConversationByListingAndBuyer(listingId, buyerId)
      if (ex[0]) {
        return { kind: 'ok' as const, conversation: ex[0] }
      }
      const inserted = await repo.insertConversation({ listingId, buyerId, sellerId })
      return { kind: 'ok' as const, conversation: inserted[0] }
    },

    async listMessages(userId: string, idRaw: string) {
      let id: string
      try {
        id = parseUuidV4(idRaw)
      } catch {
        return { kind: 'bad_id' as const }
      }
      const crows = await repo.findConversationById(id)
      const c = crows[0]
      if (!c || (c.buyerId !== userId && c.sellerId !== userId)) {
        return { kind: 'forbidden' as const }
      }
      const rows = await repo.listMessages(id)
      return { kind: 'ok' as const, messages: rows.reverse() }
    },

    async postMessage(userId: string, idRaw: string, body: MessageBody) {
      let id: string
      try {
        id = parseUuidV4(idRaw)
      } catch {
        return { kind: 'bad_id' as const }
      }
      const crows = await repo.findConversationById(id)
      const c = crows[0]
      if (!c || (c.buyerId !== userId && c.sellerId !== userId)) {
        return { kind: 'forbidden' as const }
      }
      const urows = await repo.userEmailVerified(userId)
      if (!urows[0]?.emailVerified) {
        return { kind: 'email_not_verified' as const }
      }
      const content = sanitizePlainText(body.content)
      const inserted = await repo.insertMessage({ conversationId: id, senderId: userId, content })
      await repo.touchConversationLastMessage(id)
      return { kind: 'ok' as const, message: inserted[0] }
    },
  }
}

export type ConversationsService = ReturnType<typeof createConversationsService>
