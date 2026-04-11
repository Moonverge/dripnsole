# Admin panel

## Routing

| Path | Page |
|------|------|
| `/admin` | Overview |
| `/admin/users` | Users |
| `/admin/listings` | Listings |
| `/admin/stores` | Stores |
| `/admin/reports` | Reports |
| `/admin/settings` | Platform settings (nav label: **Settings**) |

`AdminLayout` (`apps/web/src/components/layout/AdminLayout.tsx`) redirects to `/` unless `user.role === 'admin'`. Routes still use `PrivateRoute` (authenticated).

## API

Base path: **`/api/admin`** (same origin as other API routes; prefix depends on server mount).

All admin routes use `preValidation: [requireAuth, requireAdmin]` — see `apps/server/src/modules/admin/admin.router.ts`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/overview` | Dashboard stats |
| GET | `/users` | List users (search, role filter, pagination) |
| GET | `/users/:id` | User detail |
| PATCH | `/users/:id/role` | Set role `buyer` \| `seller` |
| POST | `/users/:id/suspend` | Set `suspended_at` |
| POST | `/users/:id/unsuspend` | Clear `suspended_at` |
| DELETE | `/users/:id` | Delete user |
| GET | `/listings` | List listings (search) |
| DELETE | `/listings/:id` | Soft-delete listing (`deleted_at`) |
| GET | `/stores` | List stores (search) |
| PATCH | `/stores/:id/badge` | Override `store_badge` |
| POST | `/stores/:id/suspend` | Soft-delete all active listings for store |
| GET | `/reports` | List reports (status filter) |
| PATCH | `/reports/:id` | Resolve or dismiss |
| GET | `/settings` | All platform settings rows |
| PUT | `/settings/:key` | Update one setting value (JSONB) |

## Overview stats

From `getOverviewStats()` (`apps/server/src/modules/admin/admin.repository.ts`):

| Metric | Definition |
|--------|------------|
| Total users | Count of `users` |
| Sellers | Users with `role = 'seller'` |
| Total listings | Count of `listings` |
| Transactions | Count of `transactions` with `completed_at` in the **current calendar month** |
| Signups | Users with `created_at` on **today’s date** (server local day) |
| Active listings | Listings with `availability = 'available'` and `deleted_at` null |

## Feature areas

- **Users**: Search (name/email), filter by role, change role (buyer/seller), suspend/unsuspend, delete.
- **Listings**: Search, soft delete.
- **Stores**: Search, manual badge override, suspend (bulk soft-delete that store’s listings).
- **Reports**: Filter by status; patch to **resolved** or **dismissed**.
- **Platform settings**: Keys in DB include `maintenance_mode`, `max_listings_per_seller`, `featured_sellers`, `commission_rate` (see migration `0001_roles.sql`). Values are JSONB.

## Store badge tiers

| Badge | Rules (automatic recalculation) |
|-------|-------------------------------|
| **New** | Default on `stores` |
| **Verified** | `completed_transactions >= 10`, `rating >= 4.0`, and current badge is `new` (promotion step in job) |
| **Top** | `completed_transactions >= 50`, `rating >= 4.5`, store age **≥ 90 days** |

Logic: `recalculateBadgeTiers()` in `apps/server/src/jobs/background.ts` — runs on a **24h** interval (`setInterval`).

Order matters: **Top** is applied first, then **Verified** for stores still on `new`.
