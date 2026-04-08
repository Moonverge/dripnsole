import { describe, expect, it, beforeEach } from 'vitest'
import {
  integrationContext,
  resetDatabase,
  ORIGIN_ALLOWED,
  protectedHeaders,
} from '../../../tests/helpers/integration-context.js'
import {
  createVerifiedUser,
  createStore,
  createListingWithAttachedPhoto,
  createCommentRecord,
} from '../../../tests/helpers/seed.js'
import { loginAs, loginVerifiedSeller } from '../../../tests/helpers/session.js'

describe('comments module', () => {
  beforeEach(resetDatabase)

  it('POST /api/listings/:id/comments — creates comment', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, seller.id)
    const { user: fan, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, fan.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: `/api/listings/${listing.id}/comments`,
      headers: protectedHeaders(accessToken),
      payload: { content: 'Nice' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('POST /api/listings/:id/comments — reply with parent_id returns 200', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, seller.id)
    const { user: fan, plainPassword } = await createVerifiedUser(db)
    const parent = await createCommentRecord(db, {
      listingId: listing.id,
      userId: fan.id,
      content: 'root',
    })
    const { accessToken } = await loginAs(app, fan.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: `/api/listings/${listing.id}/comments`,
      headers: protectedHeaders(accessToken),
      payload: { content: 'reply', parentId: parent.id },
    })
    expect(res.statusCode).toBe(200)
  })

  it('POST /api/listings/:id/comments — over 500 chars returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, seller.id)
    const { user: fan, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, fan.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: `/api/listings/${listing.id}/comments`,
      headers: protectedHeaders(accessToken),
      payload: { content: 'x'.repeat(501) },
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/listings/:id/comments — strips html from stored content', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, seller.id)
    const { user: fan, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, fan.email, plainPassword)
    await app.inject({
      method: 'POST',
      url: `/api/listings/${listing.id}/comments`,
      headers: protectedHeaders(accessToken),
      payload: { content: '<b>Hi</b>' },
    })
    const res = await app.inject({
      method: 'GET',
      url: `/api/listings/${listing.id}/comments`,
      headers: { origin: ORIGIN_ALLOWED },
    })
    const body = JSON.parse(res.body) as { data: { comments: { content: string }[] } }
    expect(body.data.comments[0]?.content.includes('<')).toBe(false)
  })

  it('POST /api/listings/:id/comments — unauthenticated returns 401', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, seller.id)
    const res = await app.inject({
      method: 'POST',
      url: `/api/listings/${listing.id}/comments`,
      headers: { origin: ORIGIN_ALLOWED },
      payload: { content: 'x' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('DELETE /api/comments/:id — author deletes returns 200', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, seller.id)
    const { user: fan, plainPassword } = await createVerifiedUser(db)
    const c = await createCommentRecord(db, { listingId: listing.id, userId: fan.id, content: 'x' })
    const { accessToken } = await loginAs(app, fan.email, plainPassword)
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${c.id}`,
      headers: protectedHeaders(accessToken),
    })
    expect(res.statusCode).toBe(200)
    const list = await app.inject({
      method: 'GET',
      url: `/api/listings/${listing.id}/comments`,
      headers: { origin: ORIGIN_ALLOWED },
    })
    const body = JSON.parse(list.body) as { data: { comments: { id: string }[] } }
    expect(body.data.comments.some((x) => x.id === c.id)).toBe(false)
  })

  it('DELETE /api/comments/:id — listing owner can delete', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: fan, plainPassword } = await createVerifiedUser(db)
    const c = await createCommentRecord(db, {
      listingId: listing.id,
      userId: fan.id,
      content: 'mod',
    })
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${c.id}`,
      headers: protectedHeaders(token),
    })
    expect(res.statusCode).toBe(200)
    void plainPassword
  })

  it('DELETE /api/comments/:id — stranger returns 403', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, seller.id)
    const { user: a } = await createVerifiedUser(db)
    const { user: b, plainPassword } = await createVerifiedUser(db)
    const c = await createCommentRecord(db, { listingId: listing.id, userId: a.id, content: 'x' })
    const { accessToken } = await loginAs(app, b.email, plainPassword)
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/comments/${c.id}`,
      headers: protectedHeaders(accessToken),
    })
    expect(res.statusCode).toBe(403)
  })

  it('GET /api/listings/:id/comments — nextCursor when more than limit', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user: seller } = await createVerifiedUser(db)
    const store = await createStore(db, seller.id)
    const { listing } = await createListingWithAttachedPhoto(db, store.id, seller.id)
    const { user: fan, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, fan.email, plainPassword)
    await app.inject({
      method: 'POST',
      url: `/api/listings/${listing.id}/comments`,
      headers: protectedHeaders(accessToken),
      payload: { content: 'c1' },
    })
    await app.inject({
      method: 'POST',
      url: `/api/listings/${listing.id}/comments`,
      headers: protectedHeaders(accessToken),
      payload: { content: 'c2' },
    })
    const res = await app.inject({
      method: 'GET',
      url: `/api/listings/${listing.id}/comments?limit=1`,
      headers: { origin: ORIGIN_ALLOWED },
    })
    const body = JSON.parse(res.body) as { data: { nextCursor: string | null } }
    expect(body.data.nextCursor).toBeTruthy()
  })
})
