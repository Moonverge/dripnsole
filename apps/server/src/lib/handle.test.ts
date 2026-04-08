import { describe, expect, it } from 'vitest'
import { isReservedHandle, normalizeHandle } from './handle.js'

describe('normalizeHandle', () => {
  it('lowercases uppercase input', () => {
    expect(normalizeHandle('MyShop')).toBe('myshop')
  })

  it('strips spaces and maps invalid chars to hyphen', () => {
    expect(normalizeHandle('a b@c')).toBe('a-b-c')
  })

  it('allows hyphens', () => {
    expect(normalizeHandle('my-store')).toBe('my-store')
  })

  it('rejects empty after normalization', () => {
    expect(normalizeHandle('@@@')).toBe('')
  })

  it('collapses repeated hyphens', () => {
    expect(normalizeHandle('a---b')).toBe('a-b')
  })

  it('normalizes empty input to empty string', () => {
    expect(normalizeHandle('')).toBe('')
  })
})

describe('isReservedHandle', () => {
  it('blocks admin', () => {
    expect(isReservedHandle('admin')).toBe(true)
  })

  it('allows custom handle', () => {
    expect(isReservedHandle('myunique')).toBe(false)
  })
})
