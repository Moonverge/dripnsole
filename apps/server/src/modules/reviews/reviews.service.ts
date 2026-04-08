import { sanitizePlainText } from '../../lib/sanitize-text.js'
import { parseUuidV4 } from '../../lib/uuid-v4.js'
import type { ReviewsRepository } from './reviews.repository.js'
import type { CreateReviewBody } from './reviews.model.js'

export function createReviewsService(repo: ReviewsRepository) {
  return {
    async create(reviewerId: string, body: CreateReviewBody) {
      let txId: string
      try {
        txId = parseUuidV4(body.transaction_id)
      } catch {
        return { kind: 'bad_id' as const }
      }
      const trows = await repo.findTransactionById(txId)
      const t = trows[0]
      if (!t || t.buyerId !== reviewerId) {
        return { kind: 'forbidden' as const }
      }
      const lrows = await repo.findListingById(t.listingId)
      const listing = lrows[0]
      if (!listing) {
        return { kind: 'not_found' as const }
      }
      const srows = await repo.findStoreById(listing.storeId)
      const store = srows[0]
      if (!store) {
        return { kind: 'not_found' as const }
      }
      const comment = body.comment ? sanitizePlainText(body.comment) : null
      try {
        const inserted = await repo.insertReview({
          reviewerId,
          storeId: store.id,
          listingId: listing.id,
          transactionId: txId,
          rating: body.rating,
          comment,
        })
        return { kind: 'ok' as const, review: inserted[0] }
      } catch {
        return { kind: 'conflict' as const }
      }
    },
  }
}

export type ReviewsService = ReturnType<typeof createReviewsService>
