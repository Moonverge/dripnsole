import { describe, expect, it } from 'vitest'
import { sanitizePlainText } from './sanitize-text.js'

describe('sanitizePlainText', () => {
  it('strips script tags', () => {
    expect(sanitizePlainText('<script>x</script>hi')).toBe('hi')
  })

  it('strips img onerror payloads', () => {
    const out = sanitizePlainText('<img src=x onerror=alert(1)>')
    expect(out.toLowerCase()).not.toContain('onerror')
    expect(out.toLowerCase()).not.toContain('<img')
  })

  it('passes plain text through', () => {
    expect(sanitizePlainText('hello world')).toBe('hello world')
  })
})
