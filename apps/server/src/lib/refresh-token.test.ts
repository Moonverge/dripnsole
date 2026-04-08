import { describe, expect, it } from 'vitest'
import { hashRefreshToken, newRefreshTokenRaw } from './refresh-token.js'

describe('refresh token helpers', () => {
  it('newRefreshTokenRaw returns distinct values', () => {
    const a = newRefreshTokenRaw()
    const b = newRefreshTokenRaw()
    expect(a.length).toBeGreaterThan(20)
    expect(a).not.toBe(b)
  })

  it('hashRefreshToken is stable for same input', () => {
    const h1 = hashRefreshToken('abc')
    const h2 = hashRefreshToken('abc')
    expect(h1).toBe(h2)
    expect(h1).not.toBe('abc')
  })
})
