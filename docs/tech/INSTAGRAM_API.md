# Instagram integration

## Graph API / Marketing API

- Publishing generally flows: create media container(s) → publish. Carousels require multiple container steps and a final publish call.
- Tokens are stored encrypted like Facebook (`social_connections`).

## Limitations

- Business/Creator account requirements, app review, and media format rules apply per Meta documentation.
- Handle token expiry gracefully and prompt the seller to reconnect without throwing unhandled errors in the API process.
