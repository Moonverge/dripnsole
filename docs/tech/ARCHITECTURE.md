# Architecture

## Stack

- **API**: Node.js, Fastify 4, TypeScript (`apps/server`)
- **Database**: PostgreSQL, Drizzle ORM, SQL migration `apps/server/drizzle/0000_init.sql`
- **Cache / rate limits / JWT denylist / view counters**: Redis (optional in development; required in production)
- **Object storage**: Cloudflare R2 via AWS S3-compatible client (optional in development without uploads)
- **Real-time**: Socket.IO on the same HTTP server as Fastify

## Layout

```
apps/server/src/
  index.ts              # bootstrap: env, Redis, JWT keys, listen, Socket.IO, background jobs
  build-app.ts          # Fastify instance: security, CORS, cookies, multipart, rate limit, routes
  app-deps.ts           # Fastify `deps` typing (db, pool, redis, jwt keys, env)
  db/                   # Drizzle client + schema
  routes/               # Feature routes (auth, stores, listings, …)
  plugins/              # request id, helmet CSP, CORS allowlist
  hooks/                # requireAuth, requireEmailVerified, requireClientVersion
  lib/                  # JWT, sanitization, UUID v4, social token encryption
  security/             # brute-force helpers
  services/             # view counter buffering
  jobs/                 # scheduled flush / reservation expiry / orphan photo cleanup
```

## Request lifecycle

1. `X-Request-ID` generated and echoed on every response.
2. Helmet sets CSP and related headers; CORP/COOP configured; COEP disabled on the JSON API to avoid breaking cross-origin SPA fetches.
3. CORS: only `ALLOWED_ORIGINS` (comma-separated); disallowed `Origin` receives 403.
4. Global rate limit (Redis when configured); `/api/health` skipped via route config.
5. `preHandler`: `requireClientVersion` unless route `config.public`.
6. Protected routes: `requireAuth` (+ optional `requireEmailVerified`).
7. JSON body limit 1MB; multipart limits for upload route.
8. Errors return `{ success, error?, code? }` without stack traces in production.

## WebSocket

- Server: Socket.IO attached after `fastify.ready()`.
- Client sends `handshake.auth.token` = access JWT; connection rejected if verification fails.
- Rooms: `conversation:{id}` (membership should be verified before relying on events in production).

## Background jobs

- **~60s**: flush listing view counters from Redis (or memory) into PostgreSQL.
- **~5m**: expire stale `pending` reservations and set listings back to `available` when appropriate.
- **~1h**: delete orphan `listing_photos` rows older than one hour (`listing_id` null).
