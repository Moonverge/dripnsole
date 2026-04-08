import { describe, expect, it, vi } from 'vitest'
import { parseServerEnv } from '@dripnsole/config'
import { Redis } from 'ioredis'
import { createRedis } from './client.js'

vi.mock('ioredis', () => ({
  Redis: vi.fn(function Redis(this: unknown, url: string, opts: object) {
    return { _url: url, _opts: opts }
  }),
}))

describe('createRedis', () => {
  it('returns null when REDIS_URL is unset', () => {
    const env = parseServerEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/t',
      ALLOWED_ORIGINS: 'http://localhost:3000',
    })
    expect(createRedis(env)).toBeNull()
  })

  it('returns a Redis client when REDIS_URL is set', () => {
    vi.mocked(Redis).mockClear()
    const env = parseServerEnv({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://u:p@127.0.0.1:5432/t',
      ALLOWED_ORIGINS: 'http://localhost:3000',
      REDIS_URL: 'redis://127.0.0.1:6379',
    })
    const client = createRedis(env)
    expect(client).toEqual({
      _url: 'redis://127.0.0.1:6379',
      _opts: { maxRetriesPerRequest: 2, lazyConnect: true },
    })
    expect(Redis).toHaveBeenCalledWith('redis://127.0.0.1:6379', {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    })
  })
})
