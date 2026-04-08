import { describe, expect, it, vi } from 'vitest'
import { requireEmailVerified } from './auth-pre.js'

describe('requireEmailVerified', () => {
  it('returns 401 when userId is missing', async () => {
    const send = vi.fn()
    const status = vi.fn().mockReturnValue({ send })
    const reply = { status } as never
    await requireEmailVerified({ userId: undefined } as never, reply)
    expect(status).toHaveBeenCalledWith(401)
    expect(send).toHaveBeenCalled()
  })

  it('returns 403 when email is not verified', async () => {
    const send = vi.fn()
    const status = vi.fn().mockReturnValue({ send })
    const reply = { status } as never
    const uid = 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee'
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ emailVerified: false }]),
          }),
        }),
      }),
    }
    await requireEmailVerified({ userId: uid, server: { deps: { db } } } as never, reply)
    expect(status).toHaveBeenCalledWith(403)
    expect(send).toHaveBeenCalled()
  })

  it('does not send when email is verified', async () => {
    const send = vi.fn()
    const status = vi.fn().mockReturnValue({ send })
    const reply = { status } as never
    const uid = 'bbbbbbbb-bbbb-4ccc-dddd-eeeeeeeeeeee'
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ emailVerified: true }]),
          }),
        }),
      }),
    }
    await requireEmailVerified({ userId: uid, server: { deps: { db } } } as never, reply)
    expect(status).not.toHaveBeenCalled()
  })
})
