import { randomUUID } from 'node:crypto'
import type { ServerEnv } from '@dripnsole/config'
import type { Db } from '../../db/client.js'
import { sanitizePlainText } from '../../lib/sanitize-text.js'
import { isReservedHandle, normalizeHandle } from '../../lib/handle.js'
import { conditionFromDb } from '../../lib/listing-condition.js'
import { encryptSecret } from '../../lib/social-encrypt.js'
import type { StoresRepository } from './stores.repository.js'
import type { ConnectSocialBody, CreateStoreBody, UpdateStoreBody } from './stores.model.js'

export function createStoresService(input: { db: Db; repo: StoresRepository }) {
  const { db, repo } = input

  return {
    checkHandleAvailability(raw: string) {
      const normalized = normalizeHandle(raw.replace(/^@/, ''))
      if (!normalized || isReservedHandle(normalized)) {
        return { available: false as const }
      }
      return repo.findStoreIdByHandle(normalized).then((found) => ({
        available: !found[0],
      }))
    },

    async create(userId: string, body: CreateStoreBody) {
      if (body.website?.trim()) {
        return {
          kind: 'honeypot' as const,
          store: {
            id: randomUUID(),
            handle: normalizeHandle(body.handle),
            name: sanitizePlainText(body.name),
          },
        }
      }
      const handle = normalizeHandle(body.handle)
      if (!handle || isReservedHandle(handle)) {
        return { kind: 'bad_handle' as const }
      }
      const taken = await repo.findStoreIdByHandle(handle)
      if (taken[0]) {
        return { kind: 'handle_taken' as const }
      }
      const existing = await repo.findStoreByUserId(userId)
      if (existing[0]) {
        return { kind: 'already_has_store' as const }
      }
      const storeId = repo.newStoreId()
      await db.transaction(async (tx) => {
        await repo.createStoreWithCategories(tx, {
          storeId,
          userId,
          handle,
          name: sanitizePlainText(body.name),
          bio: body.bio ? sanitizePlainText(body.bio) : null,
          pickupInfo: body.pickupInfo ? sanitizePlainText(body.pickupInfo) : null,
          shippingInfo: body.shippingInfo ? sanitizePlainText(body.shippingInfo) : null,
          categories: body.categories,
        })
      })
      return {
        kind: 'ok' as const,
        store: { id: storeId, handle, name: sanitizePlainText(body.name) },
      }
    },

    async getPublicByHandle(handleRaw: string, q: { cursor?: string; limit?: string }) {
      const handle = normalizeHandle(handleRaw.replace(/^@/, ''))
      const limit = Math.min(50, Math.max(1, Number(q.limit) || 20))
      const srows = await repo.findStoreByHandle(handle)
      const store = srows[0]
      if (!store) {
        return { kind: 'not_found' as const }
      }
      const cats = await repo.listCategories(store.id)

      let cursorDate: Date | null = null
      let cursorId: string | null = null
      if (q.cursor) {
        const [d, id] = q.cursor.split('_')
        if (d && id) {
          cursorDate = new Date(d)
          cursorId = id
        }
      }

      const lst = await repo.listListingsPage(store.id, limit, cursorDate, cursorId)
      const page = lst.slice(0, limit)
      const next = lst.length > limit ? lst[limit - 1] : null
      const ids = page.map((l) => l.id)
      const photos = await repo.findPhotosForListingIds(ids)
      const photoByListing = new Map<string, typeof photos>()
      for (const p of photos) {
        if (!p.listingId) continue
        const arr = photoByListing.get(p.listingId) ?? []
        arr.push(p)
        photoByListing.set(p.listingId, arr)
      }

      return {
        kind: 'ok' as const,
        data: {
          store: {
            id: store.id,
            handle: store.handle,
            name: store.name,
            bio: store.bio,
            bannerUrl: store.bannerUrl,
            badge: store.badge,
            rating: Number(store.rating),
            reviewCount: store.reviewCount,
            completedTransactions: store.completedTransactions,
            followerCount: store.followerCount,
            fbConnected: store.fbConnected,
            igConnected: store.igConnected,
            pickupInfo: store.pickupInfo ?? '',
            shippingInfo: store.shippingInfo ?? '',
            categories: cats.map((c) => c.category),
            createdAt: store.createdAt.toISOString(),
          },
          listings: page.map((l) => ({
            id: l.id,
            title: l.title,
            category: l.category,
            subcategory: l.subcategory,
            condition: conditionFromDb(String(l.condition)),
            price: l.price,
            availability: l.availability,
            saveCount: l.saveCount,
            commentCount: l.commentCount,
            createdAt: l.createdAt.toISOString(),
            photos: (photoByListing.get(l.id) ?? [])
              .sort((a, b) => a.order - b.order)
              .map((p) => ({ id: p.id, url: p.url, slot: p.slot, order: p.order })),
          })),
          nextCursor: next ? `${next.createdAt.toISOString()}_${next.id}` : null,
        },
      }
    },

    async updateByHandle(userId: string, handleRaw: string, body: UpdateStoreBody) {
      const handle = normalizeHandle(handleRaw.replace(/^@/, ''))
      const srows = await repo.findStoreByHandle(handle)
      const store = srows[0]
      if (!store || store.userId !== userId) {
        return { kind: 'forbidden' as const }
      }
      const b = body
      await repo.updateStore(store.id, {
        name: b.name !== undefined ? sanitizePlainText(b.name) : store.name,
        bio: b.bio !== undefined ? sanitizePlainText(b.bio) : store.bio,
        pickupInfo: b.pickupInfo !== undefined ? sanitizePlainText(b.pickupInfo) : store.pickupInfo,
        shippingInfo:
          b.shippingInfo !== undefined ? sanitizePlainText(b.shippingInfo) : store.shippingInfo,
        bannerUrl: b.bannerUrl ?? store.bannerUrl,
        updatedAt: new Date(),
      })
      return { kind: 'ok' as const }
    },

    async toggleFollowByHandle(followerId: string, handleRaw: string) {
      const handle = normalizeHandle(handleRaw.replace(/^@/, ''))
      const srows = await repo.findStoreByHandle(handle)
      const store = srows[0]
      if (!store) {
        return { kind: 'not_found' as const }
      }
      if (followerId === store.userId) {
        return { kind: 'cannot_follow_own' as const }
      }
      const following = await repo.toggleFollow(followerId, store.id)
      return { kind: 'ok' as const, following }
    },

    async followerCountByHandle(handleRaw: string) {
      const handle = normalizeHandle(handleRaw.replace(/^@/, ''))
      const srows = await repo.findStoreByHandle(handle)
      const store = srows[0]
      if (!store) {
        return { kind: 'not_found' as const }
      }
      return { kind: 'ok' as const, count: store.followerCount }
    },

    async connectSocial(
      userId: string,
      handleRaw: string,
      body: ConnectSocialBody,
      env: ServerEnv,
    ) {
      const handle = normalizeHandle(handleRaw.replace(/^@/, ''))
      const srows = await repo.findStoreByHandle(handle)
      const store = srows[0]
      if (!store || store.userId !== userId) {
        return { kind: 'forbidden' as const }
      }
      const encAccess = encryptSecret(env, body.accessToken)
      const encRefresh = body.refreshToken ? encryptSecret(env, body.refreshToken) : null
      await repo.upsertSocialConnection({
        userId,
        platform: body.platform,
        accessTokenEnc: encAccess,
        refreshTokenEnc: encRefresh,
        accountName: body.accountName ?? null,
      })
      await repo.updateStore(store.id, {
        fbConnected: body.platform === 'facebook' ? true : store.fbConnected,
        igConnected: body.platform === 'instagram' ? true : store.igConnected,
        updatedAt: new Date(),
      })
      return { kind: 'ok' as const }
    },
  }
}

export type StoresService = ReturnType<typeof createStoresService>
