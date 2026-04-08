const RESERVED = new Set([
  'admin',
  'api',
  'dashboard',
  'explore',
  'search',
  'login',
  'signup',
  'www',
  'mail',
  'support',
  'dripnsole',
])

export function normalizeHandle(raw: string): string {
  const lower = raw.toLowerCase().trim()
  return lower
    .replace(/[^a-z0-9_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function isReservedHandle(handle: string): boolean {
  return RESERVED.has(handle.toLowerCase())
}
