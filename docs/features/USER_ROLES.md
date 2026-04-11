# User roles

## Roles

| Role | How you get it |
|------|----------------|
| **buyer** | Default for new accounts |
| **seller** | One-way upgrade when the user creates a store (`POST /api/stores` completes); DB `users.role` becomes `seller` |
| **admin** | Manual DB assignment (`users.role = 'admin'`) |

There is no automatic demotion from seller to buyer in normal product flows. Admin can set a user’s role to `buyer` or `seller` via the admin API (not `admin`).

## State machine

- **buyer → seller**: One-way, triggered by successful store creation (not reversible by the user).
- **admin**: Orthogonal; an admin account is still a normal user for store/listing rules unless you model otherwise. JWT carries the current `role`; changing role in the DB does not update existing tokens until the next login/refresh/session issue.

## JWT access token

Signed RS256. Custom claim:

| Claim | Meaning |
|-------|---------|
| `sub` | User id |
| `role` | `buyer` \| `seller` \| `admin` |
| `jti` | Token id (logout denylist) |
| `iat`, `exp` | Standard JWT times |

Implementation: `apps/server/src/lib/access-jwt.ts`.

## Backend guards

| Hook | Behavior |
|------|----------|
| `requireAuth` | Valid `Bearer` token; loads `userId` / `userRole`; **403 `ACCOUNT_SUSPENDED`** if `users.suspended_at` is set |
| `requireSeller` | **403** unless `role` is `seller` or `admin` |
| `requireAdmin` | **403** unless `role` is `admin` |

Defined in `apps/server/src/hooks/auth-pre.ts`.

## Suspension

- Column: `users.suspended_at` (timestamptz). Non-null means suspended.
- `requireAuth` checks the DB after verifying the JWT and returns **403** with `code: ACCOUNT_SUSPENDED` (same message pattern as login).
- Login refuses suspended users: **403** + `ACCOUNT_SUSPENDED` (`apps/server/src/modules/auth/auth.service.ts`).

## What each persona can access

| | Guest | Buyer | Seller | Admin |
|---|:---:|:---:|:---:|:---:|
| Public catalog, store pages, listing detail | ✓ | ✓ | ✓ | ✓ |
| Account: profile, wishlist, following, messages | — | ✓ | ✓ | ✓ |
| Create store / seller dashboard / create listings | — | — | ✓ | ✓* |
| Admin panel `/admin` and `/api/admin/*` | — | — | — | ✓ |

\*Admins who also have a store behave as sellers for seller-only routes because `requireSeller` allows `admin`.
