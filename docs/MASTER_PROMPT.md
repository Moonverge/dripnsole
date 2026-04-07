# DripNSole — Master Product Vision Prompt

> **Instructions for AI:** You are helping build **DripNSole**, a thrift e-commerce web platform for clothes and shoes targeting Filipino sellers and buyers. This document is your single source of truth. When asked to generate documentation, features, components, flows, or code, always align with the vision, terminology, user roles, and architecture defined here. Use this to generate all Markdown files listed in the **MD File Index** at the bottom.

---

## 1. Platform Identity

| Field | Value |
|---|---|
| **Name** | DripNSole |
| **Tagline** | *Your thrift. Your store. Everywhere.* |
| **Market** | Philippines (PH) — targeting ukay-ukay / thrift culture |
| **Primary audience** | Thrift sellers who currently use Carousell, Facebook, or Instagram |
| **Secondary audience** | Thrift buyers looking for clothes and shoes in good condition |
| **Platform type** | Web app (mobile-first responsive) |
| **Core categories** | Clothes (tops, bottoms, dresses, outerwear, accessories) and Shoes (sneakers, heels, flats, boots, sandals) |

---

## 2. Core Philosophy

DripNSole exists to solve three real pains for Filipino thrift sellers:

1. **Fragmented inventory** — Sellers list the same item on Carousell, Facebook, and Instagram separately, and manually mark it sold in all three places.
2. **Low buyer trust** — Flat photos don't show condition well, leading to "not as described" disputes.
3. **No owned storefront** — Sellers are guests on other platforms. DripNSole gives them a permanent, branded store they own.

The platform's edge is:
- **3D spin view** for listings (photo-based, no special hardware needed)
- **One-tap cross-posting** to Facebook Page and Instagram Business
- **Built-in thrift condition standards** (BNWT, VNDS, 9/10, etc.)
- **Community-native UX** — comments, DMs, offers, follows — the same patterns thrift buyers already use on IG/Carousell

---

## 3. User Roles

### 3.1 Seller
A seller is any user who creates a store on DripNSole. They can also buy from other stores (dual role allowed).

**Seller capabilities:**
- Create and name their store (unique handle, e.g. `@ThriftByKath`)
- Customize store banner, bio, categories, and shipping/pickup info
- Upload listings with multi-angle photos → auto 3D spin view
- Tag items with condition, size, measurements, price, and category
- Toggle availability: Available / Reserved / Sold
- Manage reservations from buyers
- View sales dashboard (revenue, listing views, saves)
- Connect Facebook Page and Instagram Business account (one-time OAuth)
- Post listings (single or bulk) to FB and IG with auto-generated captions
- Receive and respond to DMs and comments from buyers
- Accept, counter, or decline price offers from buyers
- Receive ratings and reviews after completed transactions

### 3.2 Buyer
Any registered user browsing and purchasing on DripNSole.

**Buyer capabilities:**
- Browse listings by category, size, price range, condition, and store
- View 3D spin view of items in feed; tap to see full real photo gallery
- Zoom into condition/defect close-ups
- Save items to a wishlist; get notified on price drops or relists
- Follow stores and get notified on new drops
- Comment on listings (public thread)
- DM sellers privately (per-listing chat)
- Make price offers (seller can accept, counter, or decline)
- Reserve items (soft hold; seller confirms within 24h)
- Choose shipping method (Lalamove, LBC, J&T) or meetup (COD)
- Leave a rating and review after purchase
- View purchase history with receipts and item photos
- Share listings to their own IG/FB story

---

## 4. Feature Specifications

### 4.1 Store Builder
- Each seller gets a public store URL: `dripnsole.ph/@storename`
- Store page shows: banner photo, store name, handle, bio, categories sold, pickup/shipping info, seller badge, star rating, completed transaction count, response time
- Seller badge tiers: New Seller → Verified Drip → Top Drip (based on volume + ratings)

### 4.2 Listing Creation & 3D View

**Upload flow:**
1. Seller uploads 5–8 photos using a guided shot list: Front, Back, Left side, Right side, Sole/hem, Tag/label, Defect close-up (if any), Detail shot
2. Platform stitches photos into a drag-to-rotate 3D spin viewer (photo-based, using Three.js image plane rotation or `<model-viewer>` equivalent)
3. Seller previews spin, confirms, fills in listing details, and publishes

**Listing fields:**
- Title
- Category (Clothes / Shoes → subcategory)
- Condition: BNWT (Brand New With Tags) / BNWOT (Brand New Without Tags) / VNDS (Very Near Deadstock) / 9/10 / 8/10 / 7/10 / Thrifted
- Standard size (XS–5XL for clothes; EU/US/UK for shoes)
- Actual measurements in cm (chest, length, waist, etc. for clothes; insole length for shoes)
- Price (PHP)
- Negotiable toggle
- Shipping options
- Description (optional free text)

**In-feed behavior:**
- 3D spin auto-plays gently in the listing card (slow loop)
- User can grab and drag to spin manually
- Tap → opens full listing page with real photo gallery + zoom on defect photos

### 4.3 Cross-Platform Posting

**Supported platforms:**
- Facebook Page (via Facebook Graph API — free)
- Instagram Business (via Instagram Basic Display API — free)

**Posting flow:**
1. Seller goes to their store dashboard → selects one or multiple listings (checkboxes)
2. Platform auto-generates a caption: item name, price (PHP), size, condition, store link, relevant hashtags (#thriftph #ukayukay #thriftfinds #dripnsole)
3. Seller previews caption and photos; can edit caption or swap lead photo
4. One-tap confirms → posts to selected platforms simultaneously
5. When seller marks item as Sold in DripNSole → platform adds a "SOLD" comment or edits the FB/IG caption automatically

**Requirements:**
- Seller must complete one-time OAuth connect for their FB Page and IG Business account
- Bulk post: up to 20 listings per batch
- Each IG post is a carousel (up to 10 photos per item)

### 4.4 Messaging & Social

- **Comments** — Public thread on each listing (like IG comments). Buyers ask about measurements, meetup, defects. Seller and other buyers can reply.
- **DMs** — Private chat scoped per listing. Buyer taps "Message Seller" → opens a chat window with the listing card pinned at top.
- **Offers** — Buyer can submit a price offer from the listing page. Seller gets a notification and can Accept / Counter / Decline.
- **Follows** — Buyers follow stores. Followed stores appear in a "Following" feed tab. Buyer gets a push/email notification when followed store drops a new listing.
- **Story share** — Any listing can be shared as a story card to buyer's personal IG or FB (uses native share sheet).

### 4.5 Transactions

- Reservation system: buyer taps "Reserve" → item shows as "Reserved" publicly → seller confirms within 24h or reservation expires
- Shipping integrations (display-only in MVP; direct link to courier booking): Lalamove, LBC, J&T Express
- Meetup / COD: seller sets meetup location; buyer confirms
- After transaction is marked complete by both parties → review prompt unlocks

### 4.6 Buyer Discovery

- **Home feed** — Personalized mix of new listings from followed stores + trending items
- **Explore** — Browse all listings; filter by: Category, Subcategory, Size, Condition, Price (min–max), Seller badge
- **Search** — Full-text search across listing titles, store names, and tags
- **Following tab** — Feed of listings only from stores the buyer follows
- **Wishlist tab** — All saved items; sorted by date saved; shows if item has been sold or price changed

---

## 5. Tech Stack Context

> The codebase boilerplate already exists. Do not prescribe a stack — the AI should document features and flows that are stack-agnostic unless the MD specifically covers a technical layer.

Known context:
- Frontend and backend boilerplate ready
- 3D viewer: photo-based spin (Three.js or `<model-viewer>`)
- Cross-posting: Facebook Graph API + Instagram Basic Display API (both free tiers)
- Auth: OAuth 2.0 for FB/IG connection; platform's own auth for user accounts
- Storage: image/photo storage assumed (CDN-backed)
- Payments: not in MVP — transactions are offline (GCash, bank transfer, COD agreed via DM)

---

## 6. Terminology Glossary

| Term | Meaning |
|---|---|
| Drip | A listing / item for sale |
| Sole | A shoe listing specifically |
| Store | A seller's branded page on DripNSole |
| Handle | The seller's unique @username for their store |
| Spin view | The 3D photo-based rotating item preview |
| Real photos | The actual uploaded condition photos (shown after tapping spin view) |
| BNWT | Brand New With Tags |
| BNWOT | Brand New Without Tags |
| VNDS | Very Near Deadstock |
| Ukay-ukay | Filipino term for thrift shopping / secondhand goods |
| Cross-post | Pushing a listing from DripNSole to FB and/or IG automatically |
| Reserve | Buyer places a soft hold on an item pending seller confirmation |
| Drip Feed | The home feed of listings |
| Following Feed | Feed of listings from stores the buyer follows |
| Top Drip | The highest seller badge tier |

---

## 7. MD File Index

When asked to generate documentation for DripNSole, produce the following Markdown files. Each file is listed with its filename, purpose, and key sections to include.

---

### PRODUCT

| File | Purpose | Key Sections |
|---|---|---|
| `README.md` | Project overview and quick start | What is DripNSole, who it's for, core features, links to other docs |
| `VISION.md` | Full product vision document | Problem, solution, target users, platform edge, future roadmap |
| `GLOSSARY.md` | Terminology reference | All terms from Section 6 above, expanded with examples |
| `ROADMAP.md` | Feature roadmap by phase | MVP features, Phase 2 (payments), Phase 3 (Carousell integration), future |

---

### FEATURES

| File | Purpose | Key Sections |
|---|---|---|
| `features/STORE_BUILDER.md` | Store creation and customization | Store setup flow, fields, badge system, public store URL structure |
| `features/LISTING_CREATION.md` | How sellers create listings | Upload flow, photo guidelines, 3D spin generation, listing fields, publishing |
| `features/3D_SPIN_VIEW.md` | 3D viewer feature spec | How it works (photo-based), shot list guide, viewer behavior, fallback (no-JS) |
| `features/CROSS_POSTING.md` | FB + IG auto-posting | OAuth connect flow, caption generation, single vs bulk, sold sync, limitations |
| `features/MESSAGING.md` | Comments, DMs, and offers | Comment threads, DM flow, offer flow (accept/counter/decline), notifications |
| `features/TRANSACTIONS.md` | Reservations and order flow | Reserve flow, shipping options, meetup/COD, completion and review unlock |
| `features/DISCOVERY.md` | Buyer discovery features | Home feed, Explore, Search, Following tab, Wishlist, filters |
| `features/NOTIFICATIONS.md` | All notification triggers | Push, email, and in-app notifications; full trigger list for buyer and seller |

---

### USER FLOWS

| File | Purpose | Key Sections |
|---|---|---|
| `flows/SELLER_ONBOARDING.md` | New seller signup to first listing | Account creation, store setup, first listing walkthrough, connect FB/IG |
| `flows/BUYER_ONBOARDING.md` | New buyer signup to first purchase | Account creation, browse, follow a store, reserve an item |
| `flows/LISTING_TO_POST.md` | Seller posts a listing to FB + IG | Step-by-step from listing published → cross-post flow → confirmation |
| `flows/BUYER_PURCHASE.md` | Buyer finds and buys an item | Browse → view spin → gallery → comment/DM → offer → reserve → complete |
| `flows/OFFER_FLOW.md` | Offer negotiation flow | Buyer submits offer, seller receives notification, accept/counter/decline states |
| `flows/RESERVE_TO_SOLD.md` | Full transaction lifecycle | Reserve → confirm → arrange shipping/meetup → mark complete → review |

---

### DESIGN & UX

| File | Purpose | Key Sections |
|---|---|---|
| `design/UX_PRINCIPLES.md` | Design philosophy | Mobile-first, thrift-native patterns, trust signals, speed over flash |
| `design/LISTING_CARD.md` | Listing card component spec | Spin view behavior, card fields shown, sold/reserved badges, interaction states |
| `design/STORE_PAGE.md` | Store page layout spec | Banner, seller info, badge, listing grid, follow button, share |
| `design/CONDITION_STANDARDS.md` | Visual condition guide | Each condition label (BNWT → 7/10) with description, example photos guidance |

---

### TECHNICAL

| File | Purpose | Key Sections |
|---|---|---|
| `tech/ARCHITECTURE.md` | High-level system architecture | Frontend, backend, storage, APIs, 3rd party integrations |
| `tech/3D_VIEWER_IMPL.md` | 3D spin viewer implementation | Photo-based approach, Three.js/model-viewer setup, performance considerations |
| `tech/FACEBOOK_API.md` | Facebook Graph API integration | OAuth setup, posting to page, carousel posts, sold comment/edit, rate limits |
| `tech/INSTAGRAM_API.md` | Instagram Basic Display API | OAuth setup, media upload, carousel, limitations, rate limits |
| `tech/IMAGE_PIPELINE.md` | Photo upload and processing | Upload flow, compression, CDN delivery, spin view stitching |
| `tech/AUTH.md` | Authentication flows | Platform auth, FB/IG OAuth connect, session management |

---

### BUSINESS

| File | Purpose | Key Sections |
|---|---|---|
| `business/TARGET_USERS.md` | User personas | Seller persona (thrift seller from IG/FB/Carousell), buyer persona, behaviors, pain points |
| `business/MONETIZATION.md` | Revenue model (future) | Free tier, featured listings, promoted store, transaction fee (Phase 3+) |
| `business/CAROUSELL_STRATEGY.md` | Carousell integration plan | Current limitation (no public API), business API outreach plan, browser automation fallback, timeline |
| `business/COMPETITIVE_ANALYSIS.md` | Platform comparison | DripNSole vs Carousell vs FB Marketplace vs IG Shopping vs Shopee |

---

## 8. Writing Guidelines for All MDs

When generating any of the above MD files, follow these rules:

1. **Tone** — Practical and clear. Written for developers and product people building DripNSole. No fluff.
2. **Use DripNSole terminology** — Use terms from the Glossary (Section 6). Say "Spin view" not "360 view". Say "Drip" for a listing where natural.
3. **Filipino context** — Mention PH-specific details where relevant: peso (PHP) for prices, local couriers (Lalamove, LBC, J&T), GCash for payments, ukay-ukay culture.
4. **Every flow is a numbered list** — User flows should always be presented as numbered steps, not prose paragraphs.
5. **Every feature has: What it is → Why it exists → How it works → Edge cases**
6. **Technical MDs include code snippets** where applicable (API calls, component structure, config).
7. **Cross-reference related MDs** — At the bottom of each file, add a "See also" section linking to related files.
8. **No placeholder content** — Every section must have real, substantive content based on this master prompt. No "TBD" or lorem ipsum.

---

## 9. MVP Scope (Phase 1)

The following features are in-scope for the first release:

- [x] User accounts (buyer and seller roles)
- [x] Store creation with custom handle
- [x] Listing creation with photo upload and 3D spin view
- [x] Listing page with real photo gallery
- [x] Condition tagging and size/measurement fields
- [x] Availability toggle (Available / Reserved / Sold)
- [x] Public store page
- [x] Browse and Explore (category + filter)
- [x] Search
- [x] Wishlist / Save
- [x] Follow stores
- [x] Comments on listings
- [x] DM seller (per-listing chat)
- [x] Price offers
- [x] Reservation system
- [x] FB Page cross-posting (Graph API)
- [x] IG Business cross-posting (Basic Display API)
- [x] Seller dashboard (listings, views, saves)
- [x] Buyer and seller ratings/reviews

**Out of scope for MVP:**
- [ ] In-app payments (GCash, credit card)
- [ ] Carousell integration
- [ ] Native mobile app (iOS/Android)
- [ ] Seller subscription/monetization tiers
- [ ] AI-generated listing descriptions
- [ ] Live selling / video

---

*End of DripNSole Master Prompt — all MD generation should be grounded in this document.*