# Authentication

## Access token (JWT)

- **Algorithm**: RS256 using `JWT_ACCESS_PRIVATE_KEY_PEM` / `JWT_ACCESS_PUBLIC_KEY_PEM`.
- **Development**: if PEM keys are omitted, an ephemeral RSA pair is generated in memory (tokens invalid after restart).
- **Lifetime**: 15 minutes.
- **Claims**: `sub` (user id), `role: "user"`, `jti`, `iat`, `exp`. No PII in the token.
- **Logout**: `jti` is stored in Redis (`jwt:deny:{jti}`) until natural expiry so the token cannot be reused after logout.

## Refresh token

- Opaque random token, **httpOnly** cookie (`refresh_token`), `Secure` + `SameSite=strict` in production, `SameSite=lax` in development for cross-port localhost.
- **Rotation**: each `POST /api/auth/refresh` marks the previous DB row with `replaced_at` and inserts a new hash; cookie is rewritten.
- **Reuse detection**: presenting a refresh token whose row already has `replaced_at` invalidates the entire **family** (`family_id`) and clears the cookie.

## Database

- Table `refresh_tokens`: `token_hash`, `family_id`, `expires_at`, `replaced_at`, `invalidated_at`.

## Secret rotation (JWT keys)

1. Generate a new RSA key pair; set new PEM values in the environment alongside the old public key during a transition window if needed.
2. Deploy with new **private** key for signing; accept verification with **both** old and new public keys during overlap (not implemented in current codebase—plan a short maintenance window).
3. After overlap, remove the old public key from configuration.
4. Invalidate refresh families if you suspect compromise: `UPDATE refresh_tokens SET invalidated_at = now() WHERE user_id = …` or by `family_id`.

## Email verification

- Verification link token is stored hashed on `users`; `POST /api/auth/verify-email` validates and clears the hash.
