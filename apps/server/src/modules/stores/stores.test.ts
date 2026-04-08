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
  createStore,
  createVerifiedUser,
  createListingWithAttachedPhoto,
} from '../../../tests/helpers/seed.js'
import { loginAs, loginVerifiedSeller } from '../../../tests/helpers/session.js'
import { stores } from '../../db/schema.js'

describe('stores module', () => {
  beforeEach(resetDatabase)

  it('POST /api/stores/ — new user valid body returns 201 and lowercases handle', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, user.email, plainPassword)
    const handle = `Up_${randomUUID().toString().slice(0, 8)}`
    const res = await app.inject({
      method: 'POST',
      url: '/api/stores/',
      headers: protectedHeaders(accessToken),
      payload: {
        handle,
        name: 'Shop',
        categories: ['Tops'],
      },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body) as { data: { store: { handle: string } } }
    expect(body.data.store.handle).toBe(handle.toLowerCase())
  })

  it('POST /api/stores/ — taken handle returns 409', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: u1 } = await createVerifiedUser(db)
    const { user: u2, plainPassword } = await createVerifiedUser(db)
    const store = await createStore(db, u1.id, { handle: 'takenhx' })
    const { accessToken } = await loginAs(app, u2.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: '/api/stores/',
      headers: protectedHeaders(accessToken),
      payload: {
        handle: store.handle,
        name: 'Other',
        categories: ['Shoes'],
      },
    })
    expect(res.statusCode).toBe(409)
  })

  it('POST /api/stores/ — reserved handle returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, user.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: '/api/stores/',
      headers: protectedHeaders(accessToken),
      payload: {
        handle: 'admin',
        name: 'A',
        categories: ['Vintage'],
      },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/stores/ — invalid handle characters return 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, user.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: '/api/stores/',
      headers: protectedHeaders(accessToken),
      payload: {
        handle: '@@@',
        name: 'A',
        categories: ['Vintage'],
      },
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/stores/check-handle/:handle — fresh handle returns available true', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'GET',
      url: `/api/stores/check-handle/${randomUUID().toString().slice(0, 8)}`,
      headers: { origin: ORIGIN_ALLOWED },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { data: { available: boolean } }
    expect(body.data.available).toBe(true)
  })

  it('GET /api/stores/check-handle/:handle — taken handle returns available false', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user } = await createVerifiedUser(db)
    const store = await createStore(db, user.id)
    const res = await app.inject({
      method: 'GET',
      url: `/api/stores/check-handle/${store.handle}`,
      headers: { origin: ORIGIN_ALLOWED },
    })
    const body = JSON.parse(res.body) as { data: { available: boolean } }
    expect(body.data.available).toBe(false)
  })

  it('GET /api/stores/:handle — existing store returns 200 with listings', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user } = await createVerifiedUser(db)
    const store = await createStore(db, user.id)
    await createListingWithAttachedPhoto(db, store.id, user.id, { title: 'L1' })
    const res = await app.inject({
      method: 'GET',
      url: `/api/stores/${store.handle}`,
      headers: { origin: ORIGIN_ALLOWED },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { data: { listings: unknown[] } }
    expect(body.data.listings.length).toBeGreaterThanOrEqual(1)
  })

  it('GET /api/stores/:handle — missing store returns 404', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'GET',
      url: '/api/stores/nope-nope-nope-handle',
      headers: { origin: ORIGIN_ALLOWED },
    })
    expect(res.statusCode).toBe(404)
  })

  it('PUT /api/stores/:handle — owner update returns 200', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, storeId } = await loginVerifiedSeller(app, db)
    const [row] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1)
    const res = await app.inject({
      method: 'PUT',
      url: `/api/stores/${row!.handle}`,
      headers: protectedHeaders(token),
      payload: { name: 'Renamed' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('PUT /api/stores/:handle — non-owner returns 403', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: owner } = await createVerifiedUser(db)
    const store = await createStore(db, owner.id)
    const { user: other, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, other.email, plainPassword)
    const res = await app.inject({
      method: 'PUT',
      url: `/api/stores/${store.handle}`,
      headers: protectedHeaders(accessToken),
      payload: { name: 'Hack' },
    })
    expect(res.statusCode).toBe(403)
  })

  it('POST /api/stores/:handle/follow — follower increments count', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { user: fan, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, fan.email, plainPassword)
    const before = await app.inject({
      method: 'GET',
      url: `/api/stores/${store.handle}/followers`,
      headers: { origin: ORIGIN_ALLOWED },
    })
    const c0 = (JSON.parse(before.body) as { data: { count: number } }).data.count
    const res = await app.inject({
      method: 'POST',
      url: `/api/stores/${store.handle}/follow`,
      headers: protectedHeaders(accessToken),
    })
    expect(res.statusCode).toBe(200)
    const after = await app.inject({
      method: 'GET',
      url: `/api/stores/${store.handle}/followers`,
      headers: { origin: ORIGIN_ALLOWED },
    })
    const c1 = (JSON.parse(after.body) as { data: { count: number } }).data.count
    expect(c1).toBe(c0 + 1)
  })

  it('POST /api/stores/:handle/follow — owner cannot follow own store', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, storeId } = await loginVerifiedSeller(app, db)
    const [row] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1)
    const res = await app.inject({
      method: 'POST',
      url: `/api/stores/${row!.handle}/follow`,
      headers: protectedHeaders(token),
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/stores/:handle/follow — toggle unfollow decrements count', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { user: fan, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, fan.email, plainPassword)
    await app.inject({
      method: 'POST',
      url: `/api/stores/${store.handle}/follow`,
      headers: protectedHeaders(accessToken),
    })
    const mid = (
      JSON.parse(
        (
          await app.inject({
            method: 'GET',
            url: `/api/stores/${store.handle}/followers`,
            headers: { origin: ORIGIN_ALLOWED },
          })
        ).body,
      ) as { data: { count: number } }
    ).data.count
    await app.inject({
      method: 'POST',
      url: `/api/stores/${store.handle}/follow`,
      headers: protectedHeaders(accessToken),
    })
    const end = (
      JSON.parse(
        (
          await app.inject({
            method: 'GET',
            url: `/api/stores/${store.handle}/followers`,
            headers: { origin: ORIGIN_ALLOWED },
          })
        ).body,
      ) as { data: { count: number } }
    ).data.count
    expect(end).toBe(mid - 1)
  })

  it('POST /api/stores/:handle/connect-social — response body omits plaintext token', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, storeId } = await loginVerifiedSeller(app, db)
    const [row] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1)
    const secret = 'plain-fb-token-xyz'
    const res = await app.inject({
      method: 'POST',
      url: `/api/stores/${row!.handle}/connect-social`,
      headers: protectedHeaders(token),
      payload: {
        platform: 'facebook',
        accessToken: secret,
      },
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.includes(secret)).toBe(false)
  })
})
