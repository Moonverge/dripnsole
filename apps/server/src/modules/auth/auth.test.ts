import { beforeEach, describe, expect, it } from 'vitest'
import { SignJWT, jwtVerify } from 'jose'
import {
  integrationContext,
  resetDatabase,
  protectedHeaders,
  ORIGIN_ALLOWED,
  CLIENT_VERSION,
} from '../../../tests/helpers/integration-context.js'
import { emailKeyForBrute } from '../../security/brute-force.js'

function refreshFromResponse(res: {
  headers: Record<string, string | string[] | undefined>
}): string | undefined {
  const raw = res.headers['set-cookie']
  const lines = raw ? (Array.isArray(raw) ? raw : [raw]) : []
  for (const line of lines) {
    if (line.startsWith('refresh_token=')) {
      return line.split(';')[0].slice('refresh_token='.length)
    }
  }
  return undefined
}

describe('auth', () => {
  beforeEach(async () => {
    await integrationContext()
    await resetDatabase()
  })

  it('POST /api/auth/register — valid body → 201, access token, refresh httpOnly cookie', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: {
        email: 'new@test.local',
        password: 'password12345',
        name: 'Alice',
      },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body) as {
      success: boolean
      data: { accessToken: string; user: { id: string; email: string } }
    }
    expect(body.success).toBe(true)
    expect(body.data.accessToken.length).toBeGreaterThan(10)
    expect(body.data.user.email).toBe('new@test.local')
    const refresh = refreshFromResponse(res)
    expect(refresh).toBeDefined()
    const setCookie = String(res.headers['set-cookie'] ?? '')
    expect(setCookie.toLowerCase()).toContain('httponly')
  })

  it('POST /api/auth/register — duplicate email → 409', async () => {
    const { app } = await integrationContext()
    const payload = { email: 'dup@test.local', password: 'password12345', name: 'A' }
    const first = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload,
    })
    expect(first.statusCode).toBe(201)
    const second = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload,
    })
    expect(second.statusCode).toBe(409)
  })

  it('POST /api/auth/register — missing email → 400', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { password: 'password12345', name: 'A' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/auth/register — short password → 400', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'x@test.local', password: 'short', name: 'A' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/auth/register — invalid email → 400', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'not-email', password: 'password12345', name: 'A' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/auth/register — password stored as bcrypt hash not plaintext', async () => {
    const { app, pool } = await integrationContext()
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'hash@test.local', password: 'password12345', name: 'A' },
    })
    const r = await pool.query<{ password_hash: string }>(
      'select password_hash from users where email = $1',
      ['hash@test.local'],
    )
    expect(r.rows[0]?.password_hash).toBeDefined()
    expect(r.rows[0]?.password_hash).not.toBe('password12345')
    expect(r.rows[0]?.password_hash.startsWith('$2')).toBe(true)
  })

  it('GET /api/auth/me — after register → hasStore false', async () => {
    const { app } = await integrationContext()
    const reg = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'me@test.local', password: 'password12345', name: 'A' },
    })
    const token = (JSON.parse(reg.body) as { data: { accessToken: string } }).data.accessToken
    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: protectedHeaders(token),
    })
    expect(me.statusCode).toBe(200)
    const body = JSON.parse(me.body) as { data: { hasStore: boolean } }
    expect(body.data.hasStore).toBe(false)
  })

  it('POST /api/auth/login — valid credentials → 200, tokens', async () => {
    const { app } = await integrationContext()
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'log@test.local', password: 'password12345', name: 'A' },
    })
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'log@test.local', password: 'password12345' },
    })
    expect(res.statusCode).toBe(200)
    expect(refreshFromResponse(res)).toBeDefined()
  })

  it('POST /api/auth/login — wrong password → 401 generic message', async () => {
    const { app } = await integrationContext()
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'wp@test.local', password: 'password12345', name: 'A' },
    })
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'wp@test.local', password: 'wrongwrong1' },
    })
    expect(res.statusCode).toBe(401)
    const body = JSON.parse(res.body) as { error: string }
    expect(body.error).toBe('Invalid email or password')
  })

  it('POST /api/auth/login — unknown email → 401 same generic message', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'missing@test.local', password: 'password12345' },
    })
    expect(res.statusCode).toBe(401)
    const body = JSON.parse(res.body) as { error: string }
    expect(body.error).toBe('Invalid email or password')
  })

  it('POST /api/auth/login — after 5 failures → next attempt 423 with retry-after', async () => {
    const { app, redis } = await integrationContext()
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'lock@test.local', password: 'password12345', name: 'A' },
    })
    for (let i = 0; i < 5; i += 1) {
      await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { origin: ORIGIN_ALLOWED },
        payload: { email: 'lock@test.local', password: 'badbadbad1' },
      })
    }
    const locked = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'lock@test.local', password: 'password12345' },
    })
    expect(locked.statusCode).toBe(423)
    expect(locked.headers['retry-after']).toBeDefined()
    await redis.del(`bf:lock:${emailKeyForBrute('lock@test.local')}`)
    const ok = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'lock@test.local', password: 'password12345' },
    })
    expect(ok.statusCode).toBe(200)
  })

  it('POST /api/auth/login — access token payload has sub iat exp jti, no email', async () => {
    const { app, jwtPublic } = await integrationContext()
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'jwt@test.local', password: 'password12345', name: 'A' },
    })
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'jwt@test.local', password: 'password12345' },
    })
    const token = (JSON.parse(res.body) as { data: { accessToken: string } }).data.accessToken
    const { payload } = await jwtVerify(token, jwtPublic, { algorithms: ['RS256'] })
    expect(typeof payload.sub).toBe('string')
    expect(typeof payload.jti).toBe('string')
    expect(payload.iat).toBeDefined()
    expect(payload.exp).toBeDefined()
    expect(payload).not.toHaveProperty('email')
  })

  it('POST /api/auth/refresh — valid cookie → 200 and rotated refresh', async () => {
    const { app } = await integrationContext()
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'ref@test.local', password: 'password12345', name: 'A' },
    })
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'ref@test.local', password: 'password12345' },
    })
    const oldRefresh = refreshFromResponse(login)
    expect(oldRefresh).toBeDefined()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { origin: ORIGIN_ALLOWED, cookie: `refresh_token=${oldRefresh}` },
    })
    expect(res.statusCode).toBe(200)
    expect(refreshFromResponse(res)).toBeDefined()
    expect(refreshFromResponse(res)).not.toBe(oldRefresh)
  })

  it('POST /api/auth/refresh — reuse old refresh after rotation → 401', async () => {
    const { app } = await integrationContext()
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'reuse@test.local', password: 'password12345', name: 'A' },
    })
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'reuse@test.local', password: 'password12345' },
    })
    const oldRefresh = refreshFromResponse(login) as string
    await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { origin: ORIGIN_ALLOWED, cookie: `refresh_token=${oldRefresh}` },
    })
    const again = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { origin: ORIGIN_ALLOWED, cookie: `refresh_token=${oldRefresh}` },
    })
    expect(again.statusCode).toBe(401)
  })

  it('POST /api/auth/refresh — missing cookie → 401', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { origin: ORIGIN_ALLOWED },
    })
    expect(res.statusCode).toBe(401)
  })

  it('POST /api/auth/refresh — garbage cookie → 401', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { origin: ORIGIN_ALLOWED, cookie: 'refresh_token=not-a-real-token' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('POST /api/auth/logout — clears refresh and blocks access jti', async () => {
    const { app, redis, jwtPublic } = await integrationContext()
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'out@test.local', password: 'password12345', name: 'A' },
    })
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'out@test.local', password: 'password12345' },
    })
    const access = (JSON.parse(login.body) as { data: { accessToken: string } }).data.accessToken
    const { payload } = await jwtVerify(access, jwtPublic, {
      algorithms: ['RS256'],
    })
    const jti = String(payload.jti)
    const logout = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: {
        ...protectedHeaders(access),
        cookie: `refresh_token=${refreshFromResponse(login)}`,
      },
    })
    expect(logout.statusCode).toBe(200)
    const denied = await redis.get(`jwt:deny:${jti}`)
    expect(denied).toBe('1')
    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: protectedHeaders(access),
    })
    expect(me.statusCode).toBe(401)
  })

  it('GET /api/auth/me — no Authorization → 401', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { 'x-client-version': CLIENT_VERSION, origin: ORIGIN_ALLOWED },
    })
    expect(res.statusCode).toBe(401)
  })

  it('GET /api/auth/me — malformed Bearer token → 401', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: 'Bearer not-a-jwt',
        'x-client-version': CLIENT_VERSION,
        origin: ORIGIN_ALLOWED,
      },
    })
    expect(res.statusCode).toBe(401)
  })

  it('GET /api/auth/me — expired access token → 401', async () => {
    const { app, jwtPrivate, jwtPublic } = await integrationContext()
    const now = Math.floor(Date.now() / 1000)
    const token = await new SignJWT({ role: 'user' as const })
      .setProtectedHeader({ alg: 'RS256' })
      .setSubject('00000000-0000-4000-8000-000000000001')
      .setJti('11111111-1111-4111-8111-111111111111')
      .setIssuedAt(now - 120)
      .setExpirationTime(now - 60)
      .sign(jwtPrivate)
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: `Bearer ${token}`,
        'x-client-version': CLIENT_VERSION,
        origin: ORIGIN_ALLOWED,
      },
    })
    expect(res.statusCode).toBe(401)
    await expect(jwtVerify(token, jwtPublic, { algorithms: ['RS256'] })).rejects.toThrow()
  })

  it('GET /api/auth/me — valid token → 200', async () => {
    const { app } = await integrationContext()
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'ok@test.local', password: 'password12345', name: 'A' },
    })
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'ok@test.local', password: 'password12345' },
    })
    const access = (JSON.parse(login.body) as { data: { accessToken: string } }).data.accessToken
    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: protectedHeaders(access),
    })
    expect(me.statusCode).toBe(200)
  })

  it('POST /api/auth/login — success clears failure counters for email', async () => {
    const { app, redis } = await integrationContext()
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'clear@test.local', password: 'password12345', name: 'A' },
    })
    await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'clear@test.local', password: 'wrong1' },
    })
    await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { email: 'clear@test.local', password: 'password12345' },
    })
    const n = await redis.get(`bf:email:${emailKeyForBrute('clear@test.local')}`)
    expect(n === null || n === '0').toBe(true)
  })

  it('POST /api/auth/register — honeypot website field returns 200 fake success', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      headers: { origin: ORIGIN_ALLOWED },
      payload: {
        email: 'hp@test.local',
        password: 'password12345',
        name: 'Bot',
        website: 'https://spam.example',
      },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { data: { user: { email: string } } }
    expect(body.data.user.email).toBe('hp@test.local')
  })

  it('POST /api/auth/verify-email — invalid token returns 400', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-email',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { token: '0'.repeat(64) },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/auth/verify-email — malformed body returns 400', async () => {
    const { app } = await integrationContext()
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-email',
      headers: { origin: ORIGIN_ALLOWED },
      payload: { token: 'short' },
    })
    expect(res.statusCode).toBe(400)
  })
})
