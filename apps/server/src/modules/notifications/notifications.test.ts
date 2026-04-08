import { describe, expect, it, beforeEach } from 'vitest'
import {
  integrationContext,
  resetDatabase,
  protectedHeaders,
} from '../../../tests/helpers/integration-context.js'
import { createNotificationForUser, createVerifiedUser } from '../../../tests/helpers/seed.js'
import { loginAs } from '../../../tests/helpers/session.js'

describe('notifications module', () => {
  beforeEach(resetDatabase)

  it('GET /api/notifications/ — returns seeded row', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user, plainPassword } = await createVerifiedUser(db)
    await createNotificationForUser(db, user.id, { title: 'T', body: 'B' })
    const { accessToken } = await loginAs(app, user.email, plainPassword)
    const res = await app.inject({
      method: 'GET',
      url: '/api/notifications/',
      headers: protectedHeaders(accessToken),
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { data: { notifications: { title: string }[] } }
    expect(body.data.notifications.some((n) => n.title === 'T')).toBe(true)
  })

  it('PATCH /api/notifications/:id/read — marks read', async () => {
    const { app } = await integrationContext()
    const db = app.deps.db
    const { user, plainPassword } = await createVerifiedUser(db)
    const n = await createNotificationForUser(db, user.id)
    const { accessToken } = await loginAs(app, user.email, plainPassword)
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/notifications/${n.id}/read`,
      headers: protectedHeaders(accessToken),
    })
    expect(res.statusCode).toBe(200)
  })
})
