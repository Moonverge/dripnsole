# UX Principles

## Design Philosophy

- **Mobile-first** — every component is designed for 320px–480px first, then enhanced at 768px+ breakpoints.
- **Thrift-native patterns** — DMs, offers, follows, condition grading. These mirror how PH thrift buyers already behave on IG and Carousell.
- **Trust signals everywhere** — seller badges, star ratings, completed transaction counts, condition close-ups, 3D spin views. Buyers need to trust secondhand items sight-unseen.
- **Speed over flash** — no heavy animations, no loading spinners that mask slow UX. If data isn't ready, show skeletons. If a page is simple, render it instantly.

## Landing Page Conversion Flow

The landing page is designed to convert two audiences simultaneously: **buyers** (browse and buy thrift items) and **sellers** (create a store and start listing).

### Section Order (Top to Bottom)

1. **Header** — Logo, SHOP (→ /explore) and SELL (→ context-aware: signup → store setup → dashboard) tabs, search bar routing to /search, guest auth buttons (Log In / Sign Up) or user avatar dropdown when authenticated.

2. **Hero** — Full-bleed background image at 40% opacity. Title in Goblin One. One-line value prop: *"The thrift store for PH sneakers and clothes — with 3D item views and one-tap FB & IG posting."* Two CTAs:
   - Primary (green, large): **Shop Thrift Finds** → /explore
   - Secondary (outlined): **Start Selling Free** → /signup
   - Mobile: stacked vertically, full width at 480px breakpoint.

3. **Live Feed Strip** — Horizontally scrolling ticker on brand-color background. Shows recent marketplace activity ("@ThriftByKath just listed Nike Dunk Low — ₱1,200"). Auto-scrolls via CSS animation, pauses on hover. Each item links to /listing/:id. Creates urgency and sense of an active marketplace.

4. **Fresh Drops Carousel** — Horizontally scrollable product cards. Each card:
   - Links to /listing/:id
   - Shows condition badge (BNWT, VNDS, 9/10, etc.) overlaid on image
   - Heart icon toggles wishlist (redirects to /login if guest)
   - Store handle links to /store/:handle
   - Price displayed in PHP (₱)
   - "View All Drips" card at the end → /explore
   - Section title links "View All →" to /explore

5. **Browse Categories** — 2×2 grid (mobile) / 4-col grid (desktop). Black cards with icons. Each card routes to /explore with the corresponding category filter. Shows item count.

6. **Price Points** — Same grid layout. Each card routes to /explore with min/max price filter. Uses PHP (₱) amounts. Green accent on price range text.

7. **How It Works** — Buyer/Seller toggle at the top. Defaults to Buyer view.
   - **Buyer steps**: Browse → Spin in 3D → DM, offer, reserve, pay
   - **Seller steps**: Create store → Upload photos (auto spin) → Post to FB/IG
   - Toggle switches content with fadeIn animation. Numbered step indicators.

8. **Social Proof** — "Sellers Already Dripping" section. Three seller cards (horizontal scroll on mobile, 3-col grid on desktop). Each shows banner, store name, handle, badge tier, item count, star rating, and Follow button. Clicking routes to /store/:handle.

9. **About Section** — Two image+text cards on black background. Below them: full-width CTA card — "Ready to turn your thrift haul into a store?" with green **Create Your Store — It's Free** button → /signup.

10. **Footer** — Three columns: Shop (Explore, Shoes, Clothes, Trending), Sell (Start Selling, How It Works anchor, Dashboard), Company (About, Privacy, Terms). Social icons open in new tabs.

### Conversion Paths

| Visitor Type | Primary Path | Secondary Path |
|---|---|---|
| Buyer (guest) | Hero "Shop Thrift Finds" → /explore → listing → /login → wishlist/offer | Fresh Drops card → /listing/:id → /login |
| Seller (guest) | Hero "Start Selling Free" → /signup → sell prompt → /store-setup | About CTA → /signup |
| Returning buyer | Header SHOP → /explore | Search bar → /search |
| Returning seller | Header SELL → /dashboard | Header avatar → Dashboard |

### Key UX Decisions

- **No ambiguous tabs** — SHOP and SELL in the header are direct actions, not content toggles. SHOP always goes to /explore. SELL is context-aware (guest → signup, new user → store setup, seller → dashboard).
- **Guest auth is visible** — Log In and Sign Up buttons are always present in the header for guests. No hunting for auth.
- **Wishlist requires auth** — tapping heart on a card redirects to /login if not authenticated, then returns to the listing. This creates a natural signup funnel.
- **PHP currency throughout** — all prices display as ₱X,XXX. No dollar signs anywhere on the platform.
- **Condition is first-class** — condition badges appear on every card and listing. This is the #1 trust signal for thrift buyers.
- **Live feed creates urgency** — the ticker strip between hero and content shows the marketplace is active. Real listings, real sellers, real prices.

## See also

- [MASTER_PROMPT.md](../MASTER_PROMPT.md) — full product vision
- [LISTING_CARD.md](./LISTING_CARD.md) — listing card component spec (planned)
- [STORE_PAGE.md](./STORE_PAGE.md) — store page layout spec (planned)
- [CONDITION_STANDARDS.md](./CONDITION_STANDARDS.md) — condition label guide (planned)
