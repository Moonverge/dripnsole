import { randomUUID } from 'node:crypto'
import { listings, listingPhotos } from '../../db/schema.js'
import type { Db } from '../../db/client.js'
import type { RedisClient } from '../../redis/client.js'
import { sanitizePlainText } from '../../lib/sanitize-text.js'
import { parseUuidV4 } from '../../lib/uuid-v4.js'
import { bumpView } from '../../services/view-buffer.js'
import type { ListingsRepository } from './listings.repository.js'
import {
  type CreateListingBody,
  type UpdateListingBody,
  toListingDto,
  sortPhotosForDto,
  conditionToDb,
  type ListingListQuery,
} from './listings.model.js'

type ListingPhotoRow = typeof listingPhotos.$inferSelect

function buildPhotosMap(photos: ListingPhotoRow[]) {
  const byL = new Map<string, ListingPhotoRow[]>()
  for (const p of photos) {
    if (!p.listingId) continue
    const arr = byL.get(p.listingId) ?? []
    arr.push(p)
    byL.set(p.listingId, arr)
  }
  return byL
}

function sliceToPhotos(photos: ListingPhotoRow[]) {
  return photos.map((p) => ({
    id: p.id,
    url: p.url,
    slot: p.slot,
    order: p.order,
  }))
}

export function createListingsService(input: {
  db: Db
  redis: RedisClient | null
  repo: ListingsRepository
}) {
  const { db, redis, repo } = input

  return {
    async create(userId: string, body: CreateListingBody) {
      if (body.website?.trim()) {
        return { kind: 'honeypot' as const, fakeId: randomUUID(), title: body.title }
      }
      let photoIds: string[]
      try {
        photoIds = body.photoIds.map((id) => parseUuidV4(id))
      } catch {
        return { kind: 'validation' as const, message: 'Invalid photo id' }
      }
      const srows = await repo.findStoreByUserId(userId)
      const store = srows[0]
      if (!store) {
        return { kind: 'forbidden' as const, message: 'Store required' }
      }
      const newId = randomUUID()
      try {
        await db.transaction(async (tx) => {
          await repo.createListingWithPhotos(tx, {
            listingId: newId,
            storeId: store.id,
            userId,
            values: {
              id: newId,
              storeId: store.id,
              title: sanitizePlainText(body.title),
              category: body.category,
              subcategory: sanitizePlainText(body.subcategory),
              condition: conditionToDb(body.condition) as typeof listings.$inferInsert.condition,
              size: sanitizePlainText(body.size),
              sizeUnit: body.sizeUnit,
              measurements: body.measurements ?? null,
              price: body.price,
              negotiable: body.negotiable,
              shippingOptions: body.shippingOptions.map((s) => sanitizePlainText(s)),
              description: sanitizePlainText(body.description),
            },
            photoIds,
          })
        })
      } catch {
        return { kind: 'photo_attach' as const }
      }

      const row = (await repo.findListingById(newId))[0]
      const ph = await repo.findPhotosForListing(newId)
      return {
        kind: 'ok' as const,
        listing: row ? toListingDto(row, store, sortPhotosForDto(sliceToPhotos(ph))) : null,
      }
    },

    async listPublished(q: ListingListQuery) {
      const limit = q.limit
      const rows = await repo.listPublishedPage(q)
      const page = rows.slice(0, limit)
      const next = rows.length > limit ? rows[limit - 1] : null
      const ids = page.map((r) => r.listing.id)
      const photos = await repo.findPhotosForListings(ids)
      const byL = buildPhotosMap(photos)
      return {
        listings: page.map(({ listing: l, store: st }) =>
          toListingDto(l, st, sortPhotosForDto(sliceToPhotos(byL.get(l.id) ?? []))),
        ),
        nextCursor: next ? `${next.listing.createdAt.toISOString()}_${next.listing.id}` : null,
      }
    },

    async search(termRaw: string) {
      const q = termRaw.slice(0, 100)
      if (!q.trim()) {
        return { listings: [] as Record<string, unknown>[] }
      }
      const term = sanitizePlainText(q).slice(0, 100)
      const rows = await repo.searchPublished(term)
      const ids = rows.map((r) => r.listing.id)
      const photos = await repo.findPhotosForListings(ids)
      const byL = buildPhotosMap(photos)
      return {
        listings: rows.map(({ listing: l, store: st }) =>
          toListingDto(l, st, sortPhotosForDto(sliceToPhotos(byL.get(l.id) ?? []))),
        ),
      }
    },

    async feed(userId: string) {
      const followed = await repo.followedStoreIds(userId)
      const storeIds = followed.map((f) => f.storeId)
      const trending = await repo.trendingAvailable(30)
      const fromFollowed = storeIds.length === 0 ? [] : await repo.byStoreIds(storeIds, 30)
      const seen = new Set<string>()
      const merged = [...fromFollowed, ...trending].filter((x) => {
        if (seen.has(x.listing.id)) return false
        seen.add(x.listing.id)
        return true
      })
      const ids = merged.map((m) => m.listing.id)
      const photos = await repo.findPhotosForListings(ids)
      const byL = buildPhotosMap(photos)
      return {
        listings: merged.map(({ listing: l, store: st }) =>
          toListingDto(l, st, sortPhotosForDto(sliceToPhotos(byL.get(l.id) ?? []))),
        ),
      }
    },

    async myListings(userId: string) {
      const srows = await repo.findStoreByUserId(userId)
      const store = srows[0]
      if (!store) {
        return { listings: [] as Record<string, unknown>[] }
      }
      const rows = await repo.byStoreId(store.id, 100)
      const ids = rows.map((r) => r.listing.id)
      const photos = await repo.findPhotosForListings(ids)
      const byL = buildPhotosMap(photos)
      return {
        listings: rows.map(({ listing: l, store: st }) =>
          toListingDto(l, st, sortPhotosForDto(sliceToPhotos(byL.get(l.id) ?? []))),
        ),
      }
    },

    async followingListings(userId: string) {
      const followed = await repo.followedStoreIdsOnly(userId)
      const fids = followed.map((f) => f.storeId)
      if (fids.length === 0) {
        return { listings: [] as Record<string, unknown>[] }
      }
      const rows = await repo.byStoreIds(fids, 60)
      const ids = rows.map((r) => r.listing.id)
      const photos = await repo.findPhotosForListings(ids)
      const byL = buildPhotosMap(photos)
      return {
        listings: rows.map(({ listing: l, store: st }) =>
          toListingDto(l, st, sortPhotosForDto(sliceToPhotos(byL.get(l.id) ?? []))),
        ),
      }
    },

    async getById(idRaw: string) {
      let id: string
      try {
        id = parseUuidV4(idRaw)
      } catch {
        return { kind: 'bad_id' as const }
      }
      bumpView(redis, id)
      const rows = await repo.findListingWithStorePublic(id)
      const row = rows[0]
      if (!row) {
        return { kind: 'not_found' as const }
      }
      const ph = await repo.findPhotosForListing(id)
      return {
        kind: 'ok' as const,
        listing: toListingDto(row.listing, row.store, sortPhotosForDto(sliceToPhotos(ph))),
      }
    },

    async update(userId: string, idRaw: string, body: UpdateListingBody) {
      let id: string
      try {
        id = parseUuidV4(idRaw)
      } catch {
        return { kind: 'bad_id' as const }
      }
      const lrows = await repo.findListingById(id)
      const listing = lrows[0]
      if (!listing || listing.deletedAt) {
        return { kind: 'not_found' as const }
      }
      const srows = await repo.findStoreById(listing.storeId)
      const store = srows[0]
      if (!store || store.userId !== userId) {
        return { kind: 'forbidden' as const }
      }
      const b = body
      await repo.updateListingRow(id, {
        title: b.title !== undefined ? sanitizePlainText(b.title) : listing.title,
        category: b.category ?? listing.category,
        subcategory:
          b.subcategory !== undefined ? sanitizePlainText(b.subcategory) : listing.subcategory,
        condition:
          b.condition !== undefined
            ? (conditionToDb(b.condition) as typeof listings.$inferInsert.condition)
            : listing.condition,
        size: b.size !== undefined ? sanitizePlainText(b.size) : listing.size,
        sizeUnit: b.sizeUnit ?? listing.sizeUnit,
        measurements: b.measurements ?? listing.measurements,
        price: b.price ?? listing.price,
        negotiable: b.negotiable ?? listing.negotiable,
        shippingOptions:
          b.shippingOptions?.map((s) => sanitizePlainText(s)) ?? listing.shippingOptions,
        description:
          b.description !== undefined ? sanitizePlainText(b.description) : listing.description,
        updatedAt: new Date(),
      })
      const fresh = (await repo.findListingById(id))[0]
      const ph = await repo.findPhotosForListing(id)
      return {
        kind: 'ok' as const,
        listing: fresh ? toListingDto(fresh, store, sortPhotosForDto(sliceToPhotos(ph))) : null,
      }
    },

    async deleteListing(userId: string, idRaw: string) {
      let id: string
      try {
        id = parseUuidV4(idRaw)
      } catch {
        return { kind: 'bad_id' as const }
      }
      const lrows = await repo.findListingById(id)
      const listing = lrows[0]
      if (!listing) {
        return { kind: 'not_found' as const }
      }
      const srows = await repo.findStoreById(listing.storeId)
      const store = srows[0]
      if (!store || store.userId !== userId) {
        return { kind: 'forbidden' as const }
      }
      await repo.softDeleteListing(id)
      return { kind: 'ok' as const }
    },

    async setAvailability(
      userId: string,
      idRaw: string,
      availability: 'available' | 'reserved' | 'sold',
    ) {
      let id: string
      try {
        id = parseUuidV4(idRaw)
      } catch {
        return { kind: 'bad_id' as const }
      }
      const lrows = await repo.findListingById(id)
      const listing = lrows[0]
      if (!listing || listing.deletedAt) {
        return { kind: 'not_found' as const }
      }
      const srows = await repo.findStoreById(listing.storeId)
      const store = srows[0]
      if (!store || store.userId !== userId) {
        return { kind: 'forbidden' as const }
      }
      await repo.updateListingRow(id, { availability, updatedAt: new Date() })
      return { kind: 'ok' as const, availability }
    },

    async toggleSave(userId: string, idRaw: string) {
      let id: string
      try {
        id = parseUuidV4(idRaw)
      } catch {
        return { kind: 'bad_id' as const }
      }
      const lrows = await repo.findListingById(id)
      const listing = lrows[0]
      if (!listing || listing.deletedAt) {
        return { kind: 'not_found' as const }
      }
      const saved = await repo.toggleWishlist(userId, id)
      return { kind: 'ok' as const, saved }
    },
  }
}

export type ListingsService = ReturnType<typeof createListingsService>
