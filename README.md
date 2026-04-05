# DripNSole

**Your thrift. Your store. Everywhere.**

DripNSole is a thrift e-commerce platform built for the Filipino ukay-ukay community. Sellers get a branded storefront, photo-based 3D spin views for every listing, and one-tap cross-posting to Facebook and Instagram. Buyers get a discovery feed, DMs, offers, and reservations — the same patterns they already use on IG and Carousell, but on a platform that's actually built for thrift.

---

## Why

Filipino thrift sellers deal with three problems every day:

1. **Fragmented inventory** — listing the same item on Carousell, Facebook, and Instagram, then manually marking it sold in all three places.
2. **Low buyer trust** — flat photos don't show condition well, leading to "not as described" disputes.
3. **No owned storefront** — sellers are guests on other platforms with no brand, no URL, no permanence.

DripNSole fixes all three.

---

## What's Built

| Area | What |
|---|---|
| **Landing** | Hero with background overlay, product carousel, category/price grids, about section, how-it-works |
| **Auth** | Login, signup with "want to sell?" prompt, JWT persistence, route protection |
| **Store Setup** | 4-step wizard — handle picker with live URL preview, banner/bio/categories, FB/IG OAuth connect, confirmation |
| **Listing Creation** | Guided 8-slot photo upload (front/back/left/right/sole/tag/defect/detail), spin viewer preview, full form with condition scale, measurements, PHP pricing |
| **Spin Viewer** | Photo-based drag-to-rotate viewer — auto-plays in feed cards, manual spin on detail page |
| **Cross-Posting** | Auto-generated caption with #thriftph hashtags, inline edit, FB/IG checkboxes, single + bulk mode |
| **Seller Dashboard** | Stats overview, listings grid with availability toggle (Available/Reserved/Sold), bulk cross-post |
| **Public Store Page** | Banner, badge tiers (New Seller → Verified Drip → Top Drip), follow button, filterable listings |
| **Listing Detail** | Spin view / real photos toggle, measurements grid, offer flow, reserve button, public comments |
| **Explore** | All listings with filter sidebar (category, condition, price range ₱) and sort |
| **Search** | Full-text across listing titles, store names, descriptions |
| **Wishlist** | Saved items with sold/reserved status |
| **Following** | Feed of new drops from followed stores |
| **Messaging** | Split-pane DM inbox scoped per listing, inline offer accept/counter/decline |
| **Notifications** | Bell with unread count, grouped by type (offers, comments, DMs, follows) |

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Tailwind v4, Vite 6 |
| State | Zustand with persist middleware |
| Routing | React Router v7 |
| Backend | Fastify 4, TypeBox schemas |
| Database | PostgreSQL (schema in `docs/tech/DATABASE_SCHEMA.md`) |
| Monorepo | pnpm workspaces + Turborepo |

---

## Project Structure

```
apps/
  web/                  @dripnsole/web — React frontend
    src/
      components/
        common/         NotificationBell
        landing/        Hero, Carousel, Categories, PricePoints, About, HowItWorks
        layout/         AppLayout, DashboardLayout, Header, Footer
        listing/        SpinViewer, PhotoUpload, ListingCard, CrossPostModal, CommentsSection
      pages/            Home, Login, Signup, StoreSetup, Dashboard, CreateListing,
                        ListingDetail, StorePage, Explore, Search, Wishlist,
                        Following, Messages, DashboardSettings
      stores/           auth, store, listing, message, notification, wishlist
      types/            user, store, listing, message, notification, review
      routes/           PrivateRoute, PublicRoute
      styles/           theme.css (Tailwind v4 @theme with design tokens)
  server/               @dripnsole/server — Fastify API
packages/
  config/               @dripnsole/config — Zod env validation
  core/                 @dripnsole/core — shared types and constants
docs/
  MASTER_PROMPT.md      Product vision — single source of truth
  tech/                 DATABASE_SCHEMA.md (full PostgreSQL DDL)
  features/             LISTING_CREATION.md, CROSS_POSTING.md
  flows/                SELLER_ONBOARDING.md, BUYER_PURCHASE.md
  design/               (planned)
  business/             (planned)
```

---

## Design System

| Token | Value |
|---|---|
| **Heading font** | Goblin One |
| **Body font** | Martian Mono |
| **Brand** | `#2f4550` |
| **Black** | `#000000` |
| **Green accent** | `#10b981` |
| **Red accent** | `#dc2626` |
| **Surface** | `#f9f9f9` |
| **Border** | `#e5e7eb` |
| **Breakpoints** | 480px, 768px (mobile-first) |

---

## Setup

```bash
git clone git@github.com:aeolus87/dripnsole.git
cd dripnsole
cp .env.example .env
pnpm install
pnpm build
```

## Develop

```bash
pnpm dev          # starts web (port 3000) + server (port 4000)
```

Or individually:

```bash
make dev:web      # React app only
make dev:server   # API only
make db:up        # Postgres via Docker
```

## Quality

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

---

## Requirements

- Node.js 22+
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- Docker (for Postgres)

---

## Terminology

| Term | Meaning |
|---|---|
| **Drip** | A listing / item for sale |
| **Sole** | A shoe listing |
| **Spin view** | Photo-based 3D rotating item preview |
| **Handle** | Seller's unique @username (`dripnsole.ph/@handle`) |
| **BNWT** | Brand New With Tags |
| **VNDS** | Very Near Deadstock |
| **Ukay-ukay** | Filipino term for thrift shopping |
| **Cross-post** | Auto-publishing a listing to FB/IG |
| **Top Drip** | Highest seller badge tier |

---

## License

Private. Not open source.
