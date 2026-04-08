import { describe, expect, it, beforeEach } from 'vitest'
import {
  integrationContext,
  resetDatabase,
  protectedHeaders,
} from '../../../tests/helpers/integration-context.js'
import {
  createVerifiedUser,
  createStore,
  createListingWithAttachedPhoto,
} from '../../../tests/helpers/seed.js'
import { loginAs, loginVerifiedSeller } from '../../../tests/helpers/session.js'

describe('offers module', () => {
  beforeEach(resetDatabase)

  it('POST /api/offers/ — buyer creates offer returns 201', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, seller.id)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: '/api/offers/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, amount: 10_000 },
    })
    expect(res.statusCode).toBe(201)
  })

  it('POST /api/offers/ — own listing returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const res = await app.inject({
      method: 'POST',
      url: '/api/offers/',
      headers: protectedHeaders(token),
      payload: { listing_id: listing.id, amount: 1000 },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/offers/ — zero amount returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, seller.id)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: '/api/offers/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, amount: 0 },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/offers/ — amount over max returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, seller.id)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: '/api/offers/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, amount: 1_000_000 },
    })
    expect(res.statusCode).toBe(400)
  })

  it('PATCH /api/offers/:id — seller accepts returns 200', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const created = await app.inject({
      method: 'POST',
      url: '/api/offers/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, amount: 5000 },
    })
    const offerId = (JSON.parse(created.body) as { data: { offer: { id: string } } }).data.offer.id
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/offers/${offerId}`,
      headers: protectedHeaders(token),
      payload: { status: 'accepted' },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { data: { offer: { status: string } } }
    expect(body.data.offer.status).toBe('accepted')
  })

  it('PATCH /api/offers/:id — seller counters returns 200', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const created = await app.inject({
      method: 'POST',
      url: '/api/offers/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, amount: 5000 },
    })
    const offerId = (JSON.parse(created.body) as { data: { offer: { id: string } } }).data.offer.id
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/offers/${offerId}`,
      headers: protectedHeaders(token),
      payload: { status: 'countered', counter_amount: 4500 },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { data: { offer: { status: string } } }
    expect(body.data.offer.status).toBe('countered')
  })

  it('PATCH /api/offers/:id — seller declines returns 200', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const created = await app.inject({
      method: 'POST',
      url: '/api/offers/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, amount: 5000 },
    })
    const offerId = (JSON.parse(created.body) as { data: { offer: { id: string } } }).data.offer.id
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/offers/${offerId}`,
      headers: protectedHeaders(token),
      payload: { status: 'declined' },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { data: { offer: { status: string } } }
    expect(body.data.offer.status).toBe('declined')
  })

  it('PATCH /api/offers/:id — non-seller returns 403', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const created = await app.inject({
      method: 'POST',
      url: '/api/offers/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, amount: 5000 },
    })
    const offerId = (JSON.parse(created.body) as { data: { offer: { id: string } } }).data.offer.id
    const { user: other, plainPassword: p2 } = await createVerifiedUser(db)
    const { accessToken: t2 } = await loginAs(app, other.email, p2)
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/offers/${offerId}`,
      headers: protectedHeaders(t2),
      payload: { status: 'accepted' },
    })
    expect(res.statusCode).toBe(403)
    void token
  })

  it('PATCH /api/offers/:id — accept after declined returns 409', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const created = await app.inject({
      method: 'POST',
      url: '/api/offers/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, amount: 5000 },
    })
    const offerId = (JSON.parse(created.body) as { data: { offer: { id: string } } }).data.offer.id
    await app.inject({
      method: 'PATCH',
      url: `/api/offers/${offerId}`,
      headers: protectedHeaders(token),
      payload: { status: 'declined' },
    })
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/offers/${offerId}`,
      headers: protectedHeaders(token),
      payload: { status: 'accepted' },
    })
    expect(res.statusCode).toBe(409)
  })
})
