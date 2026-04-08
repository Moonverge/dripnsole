# Security model

## Headers

- **CSP** (explicit, no defaults): `default-src 'self'`; `script-src 'self'`; `style-src` allows Google Fonts; `img-src` includes CDN host from `CDN_DOMAIN` or `CDN_BASE_URL`; `connect-src` includes Facebook/Instagram APIs; `frame-ancestors 'none'`; `base-uri` / `form-action` `'self'`.
- **COEP**: not applied to the JSON API (would break typical SPA + API cross-origin setups). COOP `same-origin`, CORP `same-site`.
- **HSTS**: production only.
- **X-Frame-Options**: DENY (via helmet frameguard).
- **X-Content-Type-Options**: nosniff.
- **X-XSS-Protection**: `0` (CSP is authoritative).
- **Referrer-Policy**: `strict-origin-when-cross-origin`.
- **Permissions-Policy**: camera/microphone/geolocation/payment disabled.
- **Server / X-Powered-By**: stripped on send.

## CORS

- Only origins listed in `ALLOWED_ORIGINS`.
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS.
- Allowed headers: `Content-Type`, `Authorization`, `X-Request-ID`, `X-Client-Version`.
- `credentials: true`, `maxAge` 600s for preflight.
- Requests with a non-allowed `Origin` header receive **403**.

## Rate limiting

- Global: 200 requests / 15 minutes per IP (Redis-backed when `REDIS_URL` is set).
- Stricter limits are declared per route via `config.rateLimit` (types may require a cast against `@fastify/rate-limit` typings).
- `/api/health` skips the global limiter.
- **429** responses should include `Retry-After` when enabled by the plugin.

## Brute force (login)

- Per-email and per-IP counters in Redis (or in-memory fallback without Redis).
- 5 failures / 15 minutes per email → lock email 15 minutes (**423** + `Retry-After`).
- 20 failures / 15 minutes per IP → block IP 1 hour.
- Same error string for unknown email vs bad password.
- Exponential delay before processing failed attempts (capped at 2s).

## Input

- Bodies validated with Zod before business logic.
- User text fields passed through `sanitize-html` with **no** allowed tags.
- UUID path parameters validated as UUID v4 where enforced.
- JSON body max **1MB**; multipart totals governed by `@fastify/multipart` limits (upload route caps file count).

## SQL

- Drizzle only; no string-concatenated SQL for user input. Full-text search uses `plainto_tsquery` with bound parameters.

## Uploads

- Magic-byte check for JPEG/PNG/WebP; `sharp` metadata parse; EXIF stripped; resize; WebP output; random object key; `Content-Disposition: attachment` on direct object responses when served from R2.

## Abuse controls

- Honeypot `website` field on register and listing create: non-empty → fake success, no persistence.
- Registration burst logging when Redis sees 3+ signups / IP / hour.
- `X-Client-Version` required on all non-`public` routes.

## Logging

- Structured Fastify/pino logs with `requestId`; security-relevant failures logged at `warn` where implemented. Do not log tokens, passwords, or raw OAuth secrets.

## Environment

- Startup validation via `@dripnsole/config` / `zod`. Production requires Redis, JWT PEM keys, and `TOKEN_ENCRYPTION_KEY` (64 hex chars) for social token encryption.
