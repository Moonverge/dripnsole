import { generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import Fastify from 'fastify'
import { parseServerEnv } from '@dripnsole/config'
import { securityHeadersPlugin } from './security-headers.js'

function prodServerEnv() {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const pemPrivate = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
  const pemPublic = publicKey.export({ type: 'spki', format: 'pem' }).toString()
  return parseServerEnv({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/t',
    ALLOWED_ORIGINS: 'http://localhost:3000',
    REDIS_URL: 'redis://127.0.0.1:6379',
    JWT_ACCESS_PRIVATE_KEY_PEM: pemPrivate,
    JWT_ACCESS_PUBLIC_KEY_PEM: pemPublic,
    TOKEN_ENCRYPTION_KEY: '0'.repeat(64),
  })
}

describe('securityHeadersPlugin', () => {
  it('enables HSTS when NODE_ENV is production', async () => {
    const app = Fastify({ logger: false })
    await app.register(securityHeadersPlugin(prodServerEnv()))
    app.get('/z', async () => 'ok')
    const res = await app.inject({ url: '/z' })
    expect(String(res.headers['strict-transport-security'] || '')).toMatch(/max-age/i)
    await app.close()
  })

  it('derives img-src host from CDN_BASE_URL when CDN_DOMAIN is unset', async () => {
    const env = parseServerEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/t',
      ALLOWED_ORIGINS: 'http://localhost:3000',
      CDN_BASE_URL: 'https://static.cdn.example/foo',
    })
    const app = Fastify({ logger: false })
    await app.register(securityHeadersPlugin(env))
    app.get('/z', async () => 'ok')
    const res = await app.inject({ url: '/z' })
    const csp = String(res.headers['content-security-policy'] || '')
    expect(csp).toContain('static.cdn.example')
    await app.close()
  })

  it('uses CDN_DOMAIN for img-src when set', async () => {
    const env = parseServerEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/t',
      ALLOWED_ORIGINS: 'http://localhost:3000',
      CDN_DOMAIN: 'img-only.example',
    })
    const app = Fastify({ logger: false })
    await app.register(securityHeadersPlugin(env))
    app.get('/z', async () => 'ok')
    const res = await app.inject({ url: '/z' })
    const csp = String(res.headers['content-security-policy'] || '')
    expect(csp).toContain('img-only.example')
    await app.close()
  })
})
