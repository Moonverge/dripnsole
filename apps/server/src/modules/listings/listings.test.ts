import { describe, expect, it, beforeEach } from 'vitest'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import {
  integrationContext,
  resetDatabase,
  ORIGIN_ALLOWED,
  protectedHeaders,
} from '../../../tests/helpers/integration-context.js'
import {
  createUser,
  createVerifiedUser,
  createStore,
  createListingWithAttachedPhoto,
  createPendingPhoto,
  followStore,
  markUserSeller,
} from '../../../tests/helpers/seed.js'
import { loginAs, loginVerifiedSeller } from '../../../tests/helpers/session.js'
import { listings } from '../../db/schema.js'
import { flushViewsToDb } from '../../services/view-buffer.js'

function listingPayload(photoId: string, overrides: Record<string, unknown> = {}) {
  return {
    title: 'Item',
    category: 'Clothes',
    subcategory: 'tees',
    condition: 'BNWT',
    size: 'M',
    price: 500,
    negotiable: false,
    shippingOptions: ['meetup'],
    description: 'd',
    photoIds: [photoId],
    ...overrides,
  }
}

describe('listings module', () => {
  beforeEach(resetDatabase)

  it('POST /api/listings/ — valid payload returns 201', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, photoId } = await loginVerifiedSeller(app, db)
    const res = await app.inject({
      method: 'POST',
      url: '/api/listings/',
      headers: protectedHeaders(token),
      payload: listingPayload(photoId),
    })
    expect(res.statusCode).toBe(201)
  })

  it('POST /api/listings/ — unverified email returns 403', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user, plainPassword } = await createUser(db, { emailVerified: false })
    await createStore(db, user.id)
    const photo = await createPendingPhoto(db, user.id)
    await markUserSeller(db, user.id)
    const { accessToken } = await loginAs(app, user.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: '/api/listings/',
      headers: protectedHeaders(accessToken),
      payload: listingPayload(photo.id),
    })
    expect(res.statusCode).toBe(403)
  })

  it('POST /api/listings/ — invalid condition returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, photoId } = await loginVerifiedSeller(app, db)
    const res = await app.inject({
      method: 'POST',
      url: '/api/listings/',
      headers: protectedHeaders(token),
      payload: { ...listingPayload(photoId), condition: 'BAD' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/listings/ — negative price returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, photoId } = await loginVerifiedSeller(app, db)
    const res = await app.inject({
      method: 'POST',
      url: '/api/listings/',
      headers: protectedHeaders(token),
      payload: listingPayload(photoId, { price: -1 }),
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/listings/ — returns nextCursor when more rows exist', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user } = await createVerifiedUser(db)
    const store = await createStore(db, user.id)
    await createListingWithAttachedPhoto(db, store.id, user.id, { title: 'A' })
    await createListingWithAttachedPhoto(db, store.id, user.id, { title: 'B' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/listings/?limit=1',
      headers: { origin: ORIGIN_ALLOWED },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { data: { nextCursor: string | null } }
    expect(body.data.nextCursor).toBeTruthy()
  })

  it('GET /api/listings/ — category filter excludes other categories', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user } = await createVerifiedUser(db)
    const store = await createStore(db, user.id)
    await createListingWithAttachedPhoto(db, store.id, user.id, {
      title: 'Shirt',
      category: 'Clothes',
    })
    await createListingWithAttachedPhoto(db, store.id, user.id, {
      title: 'Kicks',
      category: 'Shoes',
    })
    const res = await app.inject({
      method: 'GET',
      url: '/api/listings/?category=Clothes',
      headers: { origin: ORIGIN_ALLOWED },
    })
    const body = JSON.parse(res.body) as { data: { listings: { title: string }[] } }
    expect(body.data.listings.some((l) => l.title === 'Shirt')).toBe(true)
    expect(body.data.listings.some((l) => l.title === 'Kicks')).toBe(false)
  })

  it('GET /api/listings/ — price range filter applies', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user } = await createVerifiedUser(db)
    const store = await createStore(db, user.id)
    await createListingWithAttachedPhoto(db, store.id, user.id, { price: 100 })
    await createListingWithAttachedPhoto(db, store.id, user.id, { price: 900 })
    const res = await app.inject({
      method: 'GET',
      url: '/api/listings/?minPrice=200&maxPrice=800',
      headers: { origin: ORIGIN_ALLOWED },
    })
    const body = JSON.parse(res.body) as { data: { listings: { price: number }[] } }
    expect(body.data.listings.length).toBe(0)
  })

  it('GET /api/listings/ — sort price_asc orders ascending', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user } = await createVerifiedUser(db)
    const store = await createStore(db, user.id)
    await createListingWithAttachedPhoto(db, store.id, user.id, { price: 500, title: 'Hi500' })
    await createListingWithAttachedPhoto(db, store.id, user.id, { price: 100, title: 'Lo100' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/listings/?sort=price_asc&limit=20',
      headers: { origin: ORIGIN_ALLOWED },
    })
    const body = JSON.parse(res.body) as { data: { listings: { price: number }[] } }
    const prices = body.data.listings.map((l) => l.price)
    const sorted = [...prices].sort((a, b) => a - b)
    expect(prices).toEqual(sorted)
  })

  it('GET /api/listings/:id — increments view count after flush', async () => {
    const { app, pool, redis } = await integrationContext()
    const db = app.deps.db
    const { user } = await createVerifiedUser(db)
    const store = await createStore(db, user.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, user.id)
    await app.inject({
      method: 'GET',
      url: `/api/listings/${listing.id}`,
      headers: { origin: ORIGIN_ALLOWED },
    })
    await flushViewsToDb(pool, redis)
    const [row] = await db.select().from(listings).where(eq(listings.id, listing.id)).limit(1)
    expect(row?.viewCount).toBeGreaterThanOrEqual(1)
  })

  it('GET /api/listings/:id — missing listing returns 404', async () => {
    const { app } = await integrationContext()
    const id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    const res = await app.inject({
      method: 'GET',
      url: `/api/listings/${id}`,
      headers: { origin: ORIGIN_ALLOWED },
    })
    expect(res.statusCode).toBe(404)
  })

  it('PUT /api/listings/:id — owner updates returns 200', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, photoId } = await loginVerifiedSeller(app, db)
    const created = await app.inject({
      method: 'POST',
      url: '/api/listings/',
      headers: protectedHeaders(token),
      payload: listingPayload(photoId),
    })
    const id = (JSON.parse(created.body) as { data: { listing: { id: string } } }).data.listing.id
    const res = await app.inject({
      method: 'PUT',
      url: `/api/listings/${id}`,
      headers: protectedHeaders(token),
      payload: listingPayload(photoId, { title: 'Updated', description: 'x' }),
    })
    expect(res.statusCode).toBe(200)
  })

  it('PUT /api/listings/:id — non-owner returns 403', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, photoId } = await loginVerifiedSeller(app, db)
    const created = await app.inject({
      method: 'POST',
      url: '/api/listings/',
      headers: protectedHeaders(token),
      payload: listingPayload(photoId),
    })
    const id = (JSON.parse(created.body) as { data: { listing: { id: string } } }).data.listing.id
    const { user: other, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, other.email, plainPassword)
    const res = await app.inject({
      method: 'PUT',
      url: `/api/listings/${id}`,
      headers: protectedHeaders(accessToken),
      payload: { title: 'X' },
    })
    expect(res.statusCode).toBe(403)
  })

  it('DELETE /api/listings/:id — owner soft-deletes listing', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, photoId } = await loginVerifiedSeller(app, db)
    const created = await app.inject({
      method: 'POST',
      url: '/api/listings/',
      headers: protectedHeaders(token),
      payload: listingPayload(photoId, { title: 'Todelete' }),
    })
    const id = (JSON.parse(created.body) as { data: { listing: { id: string } } }).data.listing.id
    const del = await app.inject({
      method: 'DELETE',
      url: `/api/listings/${id}`,
      headers: protectedHeaders(token),
    })
    expect(del.statusCode).toBe(200)
    const feed = await app.inject({
      method: 'GET',
      url: '/api/listings/?limit=50',
      headers: { origin: ORIGIN_ALLOWED },
    })
    const body = JSON.parse(feed.body) as { data: { listings: { id: string }[] } }
    expect(body.data.listings.some((l) => l.id === id)).toBe(false)
  })

  it('DELETE /api/listings/:id — non-owner returns 403', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, photoId } = await loginVerifiedSeller(app, db)
    const created = await app.inject({
      method: 'POST',
      url: '/api/listings/',
      headers: protectedHeaders(token),
      payload: listingPayload(photoId),
    })
    const id = (JSON.parse(created.body) as { data: { listing: { id: string } } }).data.listing.id
    const { user: other, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, other.email, plainPassword)
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/listings/${id}`,
      headers: protectedHeaders(accessToken),
    })
    expect(res.statusCode).toBe(403)
  })

  it('PATCH /api/listings/:id/availability — sold hides from public list', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, photoId } = await loginVerifiedSeller(app, db)
    const created = await app.inject({
      method: 'POST',
      url: '/api/listings/',
      headers: protectedHeaders(token),
      payload: listingPayload(photoId, { title: 'Solditem' }),
    })
    const id = (JSON.parse(created.body) as { data: { listing: { id: string } } }).data.listing.id
    await app.inject({
      method: 'PATCH',
      url: `/api/listings/${id}/availability`,
      headers: protectedHeaders(token),
      payload: { availability: 'sold' },
    })
    const feed = await app.inject({
      method: 'GET',
      url: '/api/listings/?limit=50',
      headers: { origin: ORIGIN_ALLOWED },
    })
    const body = JSON.parse(feed.body) as { data: { listings: { id: string }[] } }
    expect(body.data.listings.some((l) => l.id === id)).toBe(false)
  })

  it('PATCH /api/listings/:id/availability — invalid value returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, photoId } = await loginVerifiedSeller(app, db)
    const created = await app.inject({
      method: 'POST',
      url: '/api/listings/',
      headers: protectedHeaders(token),
      payload: listingPayload(photoId),
    })
    const id = (JSON.parse(created.body) as { data: { listing: { id: string } } }).data.listing.id
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/listings/${id}/availability`,
      headers: protectedHeaders(token),
      payload: { availability: 'nope' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/listings/:id/save — toggles wishlist on then off', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, seller.id)
    const { user: fan, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, fan.email, plainPassword)
    const on = await app.inject({
      method: 'POST',
      url: `/api/listings/${listing.id}/save`,
      headers: protectedHeaders(accessToken),
    })
    expect(on.statusCode).toBe(200)
    const off = await app.inject({
      method: 'POST',
      url: `/api/listings/${listing.id}/save`,
      headers: protectedHeaders(accessToken),
    })
    expect(off.statusCode).toBe(200)
  })

  it('GET /api/listings/search — empty query returns 400', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'GET',
      url: '/api/listings/search?q=%20%20%20',
      headers: { origin: ORIGIN_ALLOWED },
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/listings/search — long query returns 400', async () => {
    const { app } = await integrationContext()
    const q = 'a'.repeat(101)
    const res = await app.inject({
      method: 'GET',
      url: `/api/listings/search?q=${encodeURIComponent(q)}`,
      headers: { origin: ORIGIN_ALLOWED },
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/listings/search — finds listing by title token', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user } = await createVerifiedUser(db)
    const store = await createStore(db, user.id)
    const token = `UniqueSearchToken${randomUUID().toString().slice(0, 6)}`
    await createListingWithAttachedPhoto(db, store.id, user.id, { title: `${token} shoe` })
    const res = await app.inject({
      method: 'GET',
      url: `/api/listings/search?q=${encodeURIComponent(token)}`,
      headers: { origin: ORIGIN_ALLOWED },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { data: { listings: { title: string }[] } }
    expect(body.data.listings.some((l) => l.title.includes(token))).toBe(true)
  })

  it('GET /api/listings/following — returns listing from followed store only', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, seller.id, {
      title: 'FollowedListing',
    })
    const { user: fan, plainPassword } = await createVerifiedUser(db)
    await followStore(db, fan.id, store.id)
    const { accessToken } = await loginAs(app, fan.email, plainPassword)
    const res = await app.inject({
      method: 'GET',
      url: '/api/listings/following',
      headers: protectedHeaders(accessToken),
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { data: { listings: { id: string }[] } }
    expect(body.data.listings.some((l) => l.id === listing.id)).toBe(true)
  })
})
