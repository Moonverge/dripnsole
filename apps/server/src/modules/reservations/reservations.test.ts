import { describe, expect, it, beforeEach } from 'vitest'
import {
  integrationContext,
  resetDatabase,
  protectedHeaders,
} from '../../../tests/helpers/integration-context.js'
import { createVerifiedUser, createListingWithAttachedPhoto } from '../../../tests/helpers/seed.js'
import { loginAs, loginVerifiedSeller } from '../../../tests/helpers/session.js'

describe('reservations module', () => {
  beforeEach(resetDatabase)

  it('GET /api/reservations/ — empty list for new buyer', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, user.email, plainPassword)
    const res = await app.inject({
      method: 'GET',
      url: '/api/reservations/',
      headers: protectedHeaders(accessToken),
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { data: { reservations: unknown[] } }
    expect(body.data.reservations).toEqual([])
  })

  it('POST /api/reservations/ — buyer reserves returns 201', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: '/api/reservations/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id },
    })
    expect(res.statusCode).toBe(201)
    void token
  })

  it('POST /api/reservations/ — own listing returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const res = await app.inject({
      method: 'POST',
      url: '/api/reservations/',
      headers: protectedHeaders(token),
      payload: { listing_id: listing.id },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/reservations/ — second buyer returns 409', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: b1, plainPassword: p1 } = await createVerifiedUser(db)
    const { user: b2, plainPassword: p2 } = await createVerifiedUser(db)
    const { accessToken: t1 } = await loginAs(app, b1.email, p1)
    const { accessToken: t2 } = await loginAs(app, b2.email, p2)
    await app.inject({
      method: 'POST',
      url: '/api/reservations/',
      headers: protectedHeaders(t1),
      payload: { listing_id: listing.id },
    })
    const res = await app.inject({
      method: 'POST',
      url: '/api/reservations/',
      headers: protectedHeaders(t2),
      payload: { listing_id: listing.id },
    })
    expect(res.statusCode).toBe(409)
    void token
  })

  it('PATCH /api/reservations/:id — seller confirms returns 200', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const created = await app.inject({
      method: 'POST',
      url: '/api/reservations/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id },
    })
    const rid = (JSON.parse(created.body) as { data: { reservation: { id: string } } }).data
      .reservation.id
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/reservations/${rid}`,
      headers: protectedHeaders(token),
      payload: { status: 'confirmed' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('PATCH /api/reservations/:id — seller cancels returns 200', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const created = await app.inject({
      method: 'POST',
      url: '/api/reservations/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id },
    })
    const rid = (JSON.parse(created.body) as { data: { reservation: { id: string } } }).data
      .reservation.id
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/reservations/${rid}`,
      headers: protectedHeaders(token),
      payload: { status: 'cancelled' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('PATCH /api/reservations/:id — non-seller returns 403', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const created = await app.inject({
      method: 'POST',
      url: '/api/reservations/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id },
    })
    const rid = (JSON.parse(created.body) as { data: { reservation: { id: string } } }).data
      .reservation.id
    const { user: other, plainPassword: p2 } = await createVerifiedUser(db)
    const { accessToken: t2 } = await loginAs(app, other.email, p2)
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/reservations/${rid}`,
      headers: protectedHeaders(t2),
      payload: { status: 'confirmed' },
    })
    expect(res.statusCode).toBe(403)
    void token
  })

  it('POST /api/reservations/ — sold listing returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    await app.inject({
      method: 'PATCH',
      url: `/api/listings/${listing.id}/availability`,
      headers: protectedHeaders(token),
      payload: { availability: 'sold' },
    })
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: '/api/reservations/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id },
    })
    expect(res.statusCode).toBe(400)
  })
})
