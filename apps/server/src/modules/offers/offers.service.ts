import { parseUuidV4 } from '../../lib/uuid-v4.js'
import type { OffersRepository } from './offers.repository.js'
import type { CreateOfferBody, PatchOfferBody } from './offers.model.js'
import { offers } from '../../db/schema.js'

export function createOffersService(repo: OffersRepository) {
  return {
    async create(buyerId: string, body: CreateOfferBody) {
      let listingId: string
      try {
        listingId = parseUuidV4(body.listing_id)
      } catch {
        return { kind: 'bad_listing_id' as const }
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
        return { kind: 'invalid_offer' as const }
      }
      const inserted = await repo.insertOffer({
        listingId,
        buyerId,
        sellerId,
        amount: body.amount,
      })
      return { kind: 'ok' as const, offer: inserted[0] }
    },

    async patch(sellerId: string, idRaw: string, body: PatchOfferBody) {
      let id: string
      try {
        id = parseUuidV4(idRaw)
      } catch {
        return { kind: 'bad_id' as const }
      }
      const orows = await repo.findOfferById(id)
      const offer = orows[0]
      if (!offer) {
        return { kind: 'not_found' as const }
      }
      if (offer.sellerId !== sellerId) {
        return { kind: 'forbidden' as const }
      }
      const nextStatus = body.status ?? offer.status
      if (body.status === 'accepted' && offer.status === 'declined') {
        return { kind: 'conflict' as const }
      }
      const counter = body.counter_amount ?? offer.counterAmount
      await repo.updateOffer(id, {
        status: nextStatus as typeof offers.$inferInsert.status,
        counterAmount: counter ?? offer.counterAmount,
        updatedAt: new Date(),
      })
      const fresh = (await repo.findOfferById(id))[0]
      return { kind: 'ok' as const, offer: fresh }
    },
  }
}

export type OffersService = ReturnType<typeof createOffersService>
