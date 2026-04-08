import { describe, expect, it } from 'vitest'
import { conditionFromDb, conditionToDb } from './listing-condition.js'

describe('listing condition mapping', () => {
  it('conditionToDb maps slash grades', () => {
    expect(conditionToDb('9/10')).toBe('9_10')
  })

  it('conditionFromDb maps db token to slash', () => {
    expect(conditionFromDb('9_10')).toBe('9/10')
  })

  it('conditionFromDb returns Thrifted for unknown', () => {
    expect(conditionFromDb('nope')).toBe('Thrifted')
  })
})
