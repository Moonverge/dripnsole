import { describe, expect, it, beforeEach } from 'vitest'
import { randomUUID } from 'node:crypto'
import {
  integrationContext,
  resetDatabase,
  ORIGIN_ALLOWED,
} from '../../tests/helpers/integration-context.js'
import { createVerifiedUser } from '../../tests/helpers/seed.js'
import { loginAs } from '../../tests/helpers/session.js'

describe('plugins', () => {
  beforeEach(resetDatabase)

  it('GET /api/health — response includes X-Frame-Options deny', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(String(res.headers['x-frame-options'] || '').toUpperCase()).toContain('DENY')
  })

  it('GET /api/health — response includes X-Content-Type-Options nosniff', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })

  it('GET /api/health — response includes CSP frame-ancestors none', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    const csp = String(res.headers['content-security-policy'] || '')
    expect(csp.toLowerCase()).toContain('frame-ancestors')
    expect(csp).toMatch(/'none'|none/i)
  })

  it('GET /api/health — omits X-Powered-By', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('GET /api/health — omits Server header', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.headers.server).toBeUndefined()
  })

  it('GET /api/health — includes X-Request-ID as uuid v4', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    const id = String(res.headers['x-request-id'] || '')
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('GET /api/stores/check-handle/x — allowed Origin gets ACAO', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'GET',
      url: '/api/stores/check-handle/abc',
      headers: { origin: ORIGIN_ALLOWED },
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN_ALLOWED)
  })

  it('GET /api/stores/check-handle/x — disallowed Origin returns 403', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'GET',
      url: '/api/stores/check-handle/abc',
      headers: { origin: 'https://evil.example' },
    })
    expect(res.statusCode).toBe(403)
  })

  it('OPTIONS /api/stores/check-handle/x — preflight from allowed origin returns 204', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/stores/check-handle/abc',
      headers: {
        origin: ORIGIN_ALLOWED,
        'access-control-request-method': 'GET',
      },
    })
    expect(res.statusCode).toBe(204)
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN_ALLOWED)
  })

  it('OPTIONS /api/auth/login — preflight returns 204', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/auth/login',
      headers: {
        origin: ORIGIN_ALLOWED,
        'access-control-request-method': 'POST',
      },
    })
    expect(res.statusCode).toBe(204)
  })

  it('POST /api/auth/register — eleventh request in window returns 429', async () => {
    const { app } = await integrationContext()
    let lastStatus = 200
    for (let i = 0; i < 11; i += 1) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        headers: { origin: ORIGIN_ALLOWED, 'x-ratelimit-test': '1' },
        payload: {
          email: `r${i}_${randomUUID()}@t.local`,
          password: 'password123',
          name: 'T',
        },
      })
      lastStatus = res.statusCode
    }
    expect(lastStatus).toBe(429)
  })

  it('POST /api/auth/logout — missing X-Client-Version returns 400', async () => {
    const { app, pool: _p } = await integrationContext()
    void _p
    const db = app.deps.db
    const { user, plainPassword } = await createVerifiedUser(db)
    const { accessToken } = await loginAs(app, user.email, plainPassword)
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: {
        authorization: `Bearer ${accessToken}`,
        origin: ORIGIN_ALLOWED,
      },
    })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/stores/check-handle/x — exceeds global rate limit returns 429', async () => {
    const { app } = await integrationContext()
    let last = 200
    for (let i = 0; i < 201; i += 1) {
      const res = await app.inject({
        method: 'GET',
        url: `/api/stores/check-handle/g${i}`,
        headers: { origin: ORIGIN_ALLOWED, 'x-ratelimit-test': '1' },
      })
      last = res.statusCode
    }
    expect(last).toBe(429)
  }, 120_000)
})
