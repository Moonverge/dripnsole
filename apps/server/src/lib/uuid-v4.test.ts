import { describe, expect, it } from 'vitest'
import { parseUuidV4 } from './uuid-v4.js'

const v4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('parseUuidV4', () => {
  it('accepts valid uuid v4', () => {
    const id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    expect(parseUuidV4(id)).toBe(id)
  })

  it('rejects invalid string', () => {
    expect(() => parseUuidV4('not-uuid')).toThrow()
  })

  it('two random UUIDs differ', () => {
    const a = crypto.randomUUID()
    const b = crypto.randomUUID()
    expect(a).toMatch(v4)
    expect(b).toMatch(v4)
    expect(a).not.toBe(b)
  })
})
