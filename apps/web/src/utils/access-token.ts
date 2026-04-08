let accessToken: string | null = null
const clearListeners: (() => void)[] = []

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function onSessionCleared(fn: () => void): void {
  clearListeners.push(fn)
}

export function clearAccessToken(): void {
  accessToken = null
  for (const fn of clearListeners) {
    fn()
  }
}
