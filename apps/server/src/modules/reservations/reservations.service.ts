import { parseUuidV4 } from '../../lib/uuid-v4.js'
import type { ReservationsRepository } from './reservations.repository.js'
import type { CreateReservationBody, PatchReservationBody } from './reservations.model.js'
import { reservations } from '../../db/schema.js'

function isPgUniqueViolation(err: unknown): boolean {
  if (err !== null && typeof err === 'object') {
    const o = err as { code?: string; cause?: unknown }
    if (o.code === '23505') return true
    if (o.cause !== undefined) return isPgUniqueViolation(o.cause)
  }
  return false
}

export function createReservationsService(repo: ReservationsRepository) {
  return {
    async listForUser(userId: string) {
      const asBuyer = await repo.listAsBuyer(userId)
      const owned = await repo.selectOwnedListingIdsForUser(userId)
      const ownedIds = owned.map((o) => o.id)
      const asSeller = await repo.listAsSellerByListingIds(ownedIds)
      const merged = [...asBuyer, ...asSeller]
      const seen = new Set<string>()
      const uniq = merged.filter((r) => {
        if (seen.has(r.id)) return false
        seen.add(r.id)
        return true
      })
      return { reservations: uniq }
    },

    async create(buyerId: string, body: CreateReservationBody) {
      let listingId: string
      try {
        listingId = parseUuidV4(body.listing_id)
      } catch {
        return { kind: 'bad_id' as const }
      }
      const lrows = await repo.findListingById(listingId)
      const listing = lrows[0]
      if (!listing || listing.deletedAt) {
        return { kind: 'not_found' as const }
      }
      if (listing.availability !== 'available') {
        if (listing.availability === 'reserved') {
          return { kind: 'conflict' as const }
        }
        return { kind: 'invalid' as const }
      }
      const srows = await repo.findStoreById(listing.storeId)
      const store = srows[0]
      if (!store || store.userId === buyerId) {
        return { kind: 'invalid' as const }
      }
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      try {
        const inserted = await repo.insertReservation({
          listingId,
          buyerId,
          status: 'pending',
          expiresAt,
        })
        await repo.setListingAvailability(listingId, 'reserved')
        return { kind: 'ok' as const, reservation: inserted[0] }
      } catch (e: unknown) {
        if (isPgUniqueViolation(e)) {
          return { kind: 'conflict' as const }
        }
        return { kind: 'invalid' as const }
      }
    },

    async patch(sellerUserId: string, idRaw: string, body: PatchReservationBody) {
      let id: string
      try {
        id = parseUuidV4(idRaw)
      } catch {
        return { kind: 'bad_id' as const }
      }
      const rrows = await repo.findReservationById(id)
      const resv = rrows[0]
      if (!resv) {
        return { kind: 'not_found' as const }
      }
      const lrows = await repo.findListingById(resv.listingId)
      const listing = lrows[0]
      const srows = listing ? await repo.findStoreById(listing.storeId) : []
      const store = srows[0]
      if (!store || store.userId !== sellerUserId) {
        return { kind: 'forbidden' as const }
      }
      const status = body.status ?? resv.status
      await repo.updateReservationStatus(id, status as typeof reservations.$inferInsert.status)
      if (status === 'cancelled' || status === 'expired') {
        await repo.setListingAvailability(resv.listingId, 'available')
      }
      if (status === 'confirmed') {
        await repo.setListingAvailability(resv.listingId, 'reserved')
      }
      const fresh = (await repo.findReservationById(id))[0]
      return { kind: 'ok' as const, reservation: fresh }
    },
  }
}

export type ReservationsService = ReturnType<typeof createReservationsService>
