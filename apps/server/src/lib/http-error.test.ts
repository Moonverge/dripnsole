import { describe, expect, it } from 'vitest'
import { HttpError } from './http-error.js'

describe('HttpError', () => {
  it('stores status code message and code', () => {
    const e = new HttpError(418, 'teapot', 'TEAPOT', { 'x-test': '1' })
    expect(e.statusCode).toBe(418)
    expect(e.message).toBe('teapot')
    expect(e.code).toBe('TEAPOT')
    expect(e.headers).toEqual({ 'x-test': '1' })
  })
})
