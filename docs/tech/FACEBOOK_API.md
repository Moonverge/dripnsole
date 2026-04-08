# Facebook integration

## Storage

- Long-lived user tokens for Graph API should be stored **encrypted** (AES-256-GCM in application code using `TOKEN_ENCRYPTION_KEY`) in `social_connections.access_token_enc` / `refresh_token_enc`.
- Never log token values.

## Posting

- Use Graph API endpoints appropriate for the token type (user vs page). Handle `error_subcode` for expired or revoked tokens and surface a “reconnect Facebook” notification to the seller.

## OAuth

- Use `FB_APP_ID` / `FB_APP_SECRET` for server-side code exchange; keep secrets out of logs and client bundles.

## Rate limits

- Respect Meta rate limits; the API applies per-route rate limits on expensive operations (e.g. cross-post) when those routes are implemented.
