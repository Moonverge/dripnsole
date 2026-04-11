# Buyer profile (own account)

## Route

- **`/profile`** — requires login (`PrivateRoute` + `AppLayout`).

## Header

Shows **avatar** (image or initials), **display name**, **email**, **Member since** (`createdAt`, formatted), and a **role** pill (Buyer / Seller / Admin).

## Tabs

| Tab | Behavior |
|-----|----------|
| **Profile** | Edit profile + change password + role-specific CTAs (below) |
| **Wishlist** | Blurb + link to **`/wishlist`** |
| **Following** | Blurb + link to **`/following`** |

Implementation: `apps/web/src/pages/Profile.tsx`.

## Edit profile

- **PUT** `/api/users/me`
- Body: `name` (required in UI flow), optional `profilePic` (URL string).
- Frontend helpers: `UPDATE_PROFILE()` → `/users/me` in `apps/web/src/utils/api.routes.ts`.
- On success, `refreshProfile()` reloads the user from **`GET /api/auth/me`** (`PROFILE()`).

## Change password

- **POST** `/api/users/me/change-password`
- Body: `currentPassword`, `newPassword` (UI also requires confirm match and min length 8).
- Frontend: `CHANGE_PASSWORD()` in `api.routes.ts`.

## Seller CTAs

| Role | UI |
|------|-----|
| **buyer** | Card with **Become a Seller** → **`/store-setup`** |
| **seller** or **admin** | **View My Store** → `/store/:handle` when `myStore` is loaded; **Go to Dashboard** → **`/dashboard`** |

Store handle comes from `useStoreStore().fetchMyStore()` when role is seller or admin.
