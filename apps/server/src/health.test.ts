import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { requestContextPlugin } from './plugins/request-context.js'
import { healthRoutes } from './routes/health.js'

describe('GET /api/health', () => {
  it('returns health payload', async () => {
    const app = Fastify({ logger: false })
    await app.register(requestContextPlugin)
    app.decorate('deps', {
      pool: {
        query: async () => ({ rows: [{ ok: 1 }] }),
      },
      env: { APP_VERSION: '0.0.0-test' },
    } as never)
    await app.register(healthRoutes, { prefix: '/api' })
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as {
      success: boolean
      data: { status: string; db: boolean; version: string }
    }
    expect(body.success).toBe(true)
    expect(body.data.db).toBe(true)
    expect(body.data.status).toBe('ok')
    expect(body.data.version).toBe('0.0.0-test')
    await app.close()
  })

  it('returns degraded when database query fails', async () => {
    const app = Fastify({ logger: false })
    await app.register(requestContextPlugin)
    app.decorate('deps', {
      pool: {
        query: async () => {
          throw new Error('down')
        },
      },
      env: { APP_VERSION: '0.0.0-test' },
    } as never)
    await app.register(healthRoutes, { prefix: '/api' })
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as {
      data: { status: string; db: boolean }
    }
    expect(body.data.db).toBe(false)
    expect(body.data.status).toBe('degraded')
    await app.close()
  })
})
