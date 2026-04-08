import { describe, expect, it, beforeEach } from 'vitest'
import {
  integrationContext,
  resetDatabase,
  protectedHeaders,
} from '../../../tests/helpers/integration-context.js'
import { createVerifiedUser, createListingWithAttachedPhoto } from '../../../tests/helpers/seed.js'
import { loginAs, loginVerifiedSeller } from '../../../tests/helpers/session.js'

describe('conversations module', () => {
  beforeEach(resetDatabase)

  it('POST /api/conversations/ — start on listing returns 200', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: '/api/conversations/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, recipient_id: userId },
    })
    expect(res.statusCode).toBe(200)
    void token
  })

  it('POST /api/conversations/ — buyer equals recipient returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: '/api/conversations/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, recipient_id: buyer.id },
    })
    expect(res.statusCode).toBe(400)
    void plainPassword
    void token
  })

  it('GET /api/conversations/ — returns only conversations for caller', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    await app.inject({
      method: 'POST',
      url: '/api/conversations/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, recipient_id: userId },
    })
    const mine = await app.inject({
      method: 'GET',
      url: '/api/conversations/',
      headers: protectedHeaders(accessToken),
    })
    expect(mine.statusCode).toBe(200)
    const body = JSON.parse(mine.body) as { data: { conversations: unknown[] } }
    expect(body.data.conversations.length).toBeGreaterThanOrEqual(1)
    void token
  })

  it('GET /api/conversations/:id/messages — outsider returns 403', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const created = await app.inject({
      method: 'POST',
      url: '/api/conversations/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, recipient_id: userId },
    })
    const convId = (JSON.parse(created.body) as { data: { conversation: { id: string } } }).data
      .conversation.id
    const { user: other, plainPassword: pw2 } = await createVerifiedUser(db)
    const { accessToken: tok2 } = await loginAs(app, other.email, pw2)
    const res = await app.inject({
      method: 'GET',
      url: `/api/conversations/${convId}/messages`,
      headers: protectedHeaders(tok2),
    })
    expect(res.statusCode).toBe(403)
    void token
  })

  it('POST /api/conversations/:id/messages — over 1000 chars returns 400', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const created = await app.inject({
      method: 'POST',
      url: '/api/conversations/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, recipient_id: userId },
    })
    const convId = (JSON.parse(created.body) as { data: { conversation: { id: string } } }).data
      .conversation.id
    const res = await app.inject({
      method: 'POST',
      url: `/api/conversations/${convId}/messages`,
      headers: protectedHeaders(accessToken),
      payload: { content: 'z'.repeat(1001) },
    })
    expect(res.statusCode).toBe(400)
    void token
  })

  it('POST /api/conversations/:id/messages — html is sanitized in listing', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { token, userId, storeId } = await loginVerifiedSeller(app, db)
    const { listing } = await createListingWithAttachedPhoto(db, storeId, userId)
    const { user: buyer, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, buyer.email, plainPassword)
    const created = await app.inject({
      method: 'POST',
      url: '/api/conversations/',
      headers: protectedHeaders(accessToken),
      payload: { listing_id: listing.id, recipient_id: userId },
    })
    const convId = (JSON.parse(created.body) as { data: { conversation: { id: string } } }).data
      .conversation.id
    await app.inject({
      method: 'POST',
      url: `/api/conversations/${convId}/messages`,
      headers: protectedHeaders(accessToken),
      payload: { content: '<script>x</script>hi' },
    })
    const msgs = await app.inject({
      method: 'GET',
      url: `/api/conversations/${convId}/messages`,
      headers: protectedHeaders(accessToken),
    })
    const body = JSON.parse(msgs.body) as { data: { messages: { content: string }[] } }
    const last = body.data.messages[body.data.messages.length - 1]
    expect(last?.content.includes('script')).toBe(false)
    void token
  })
})
