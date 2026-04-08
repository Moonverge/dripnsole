declare module 'ioredis-mock' {
  import type { Redis } from 'ioredis'

  const MockRedis: new () => Redis
  export default MockRedis
}
