# Buyer purchase flow

How a buyer discovers a **Drip** (listing), inspects it with **Spin view** and real photos, talks to the seller, negotiates when allowed, reserves the item, arranges **Lalamove** / **LBC** / **J&T** or meetup **COD**, and closes the loop with a rating. Prices are in **PHP**; context is Filipino thrift and **ukay-ukay** buying.

---

## 1. Browse / Explore / Search → find a Drip

### What it is

Discovery through home feed, categories, or search until the buyer finds a listing they want.

### Why it exists

Thrift inventory is one-of-one; search and explore replace walking a physical ukay rack.

### How it works

1. Buyer opens **Explore** or **Browse** (or uses **Search** for brand, size, keyword).
2. Buyer scrolls results; filters may include category (**Clothes** vs **Sole**), size, price range in **PHP**.
3. Buyer identifies a Drip to inspect further.

### Edge cases

- **No results:** suggest broader filters or saved searches.
- **Stale listing:** if seller forgot to mark sold, buyer may still open detail—resolved in reservation/chat.

---

## 2. View Spin view in the feed card

### What it is

On the feed card, **Spin view** runs: photo-based rotation; **auto-play** may animate the spin.

### Why it exists

Quick visual trust before tapping in—important for sneakers and jackets.

### How it works

1. Card shows Spin view preview.
2. Buyer can **drag to spin** (or swipe) on supported surfaces; feed may **auto-play** rotation.

### Edge cases

- **Reduced motion / data saver:** auto-play may pause; static hero image fallback.

---

## 3. Tap → listing detail: full Spin view + “See Real Photos” gallery

### What it is

**Listing detail** page with full **Spin view** (drag to spin) plus a **See Real Photos** gallery for stills (tags, defects, details).

### Why it exists

Spin gives form; gallery gives pixel-level inspection for flaws and labels.

### How it works

1. Buyer taps the card.
2. Detail page loads full Spin view and **See Real Photos**.
3. Buyer reviews visuals before reading copy.

### Edge cases

- **Slow network:** progressive loading with placeholders.

---

## 4. Check condition, size, measurements

### What it is

Buyer reads **condition** (BNWT, BNWOT, VNDS, 9/10, etc.), **standard size** (XS–5XL for clothes; EU/US/UK for **Sole**), and **measurements in cm** where provided.

### Why it exists

Ukay sizing varies by brand; measurements reduce wrong-size returns.

### How it works

1. Buyer scrolls to structured fields and description.
2. Buyer compares to their own measurements or usual sizes.

### Edge cases

- **Missing measurements:** buyer should ask in comments/DM before offering.

---

## 5. Comment (public thread) or DM seller

### What it is

**Public comment thread** on the Drip and/or **DM** to the seller for private details (meetup spot, bundle, COD).

### Why it exists

Public Q&A helps future buyers; DM handles sensitive info.

### How it works

1. Buyer posts a **comment** for general questions (e.g., “Length nito in cm?”).
2. Buyer opens **DM** for phone, exact meetup, or negotiation privacy if needed.

### Edge cases

- **Harassment / spam:** report/block flows (platform policy).
- **Moving off-platform:** risk reminder; DripNSole may not mediate off-app deals.

---

## 6. Make price offer (if negotiable) → Accept / Counter / Decline

### What it is

If the Drip has **Negotiable** on, buyer sends an offer in **PHP**; seller **Accepts**, **Counters**, or **Declines**.

### Why it exists

Ukay culture often expects haggle; structured offers reduce ambiguous “last price po?” threads.

### How it works

1. Buyer taps **Make offer** (or equivalent) and enters amount in **PHP**.
2. Seller receives offer notification.
3. Seller chooses **Accept**, **Counter** with another **PHP** amount, or **Decline**.
4. If accepted, price expectation is clear for reservation/checkout handoff.

### Edge cases

- **Not negotiable:** offer UI hidden; buyer can only buy at listed price or ask in chat (policy-dependent).
- **Stale offer after long delay:** auto-expire offers if product supports it.

---

## 7. Reserve item → seller confirms within 24h

### What it is

Buyer **reserves** the item; seller must **confirm** within **24 hours** (or the reservation lapses).

### Why it exists

Prevents endless holds on single-quantity thrift items.

### How it works

1. Buyer taps **Reserve** (after price is agreed if negotiable).
2. Seller gets a confirmation request.
3. Seller confirms within **24h**; otherwise reservation releases.

### Edge cases

- **Seller no-show:** buyer can move on; optional report.
- **Two buyers:** first confirmed reservation wins if stock is one.

---

## 8. Arrange shipping (Lalamove / LBC / J&T) or meetup / COD via DM

### What it is

Logistics: national couriers (**LBC**, **J&T**), on-demand (**Lalamove**), or **meetup** with **COD** arranged in **DM**.

### Why it exists

Mirrors how Filipino peer-to-peer sales actually settle—hybrid courier and same-city meetups.

### How it works

1. Buyer and seller agree in **DM** on method matching what the Drip advertised.
2. They exchange booking details: tracking for couriers, pin for Lalamove, or time/place for meetup **COD**.
3. Buyer completes payment per agreement (outside or inside app, per product).

### Edge cases

- **Courier failure / delay:** communicate in DM; platform may not refund if payment was outside escrow.
- **Meetup safety:** prefer public places; platform may show safety tips.

---

## 9. Mark transaction complete

### What it is

Both sides (or buyer) marks the deal **complete** once item and payment are settled.

### Why it exists

Closes the lifecycle and unlocks review; may trigger **Sold** updates on cross-posted social posts (see [CROSS_POSTING.md](../features/CROSS_POSTING.md)).

### How it works

1. After handoff, buyer (and/or seller) confirms **Complete** on the order/thread.
2. Drip can auto-move to **Sold** if tied to inventory.

### Edge cases

- **Dispute:** open dispute flow if implemented; otherwise support contact.

---

## 10. Leave rating and review

### What it is

Buyer leaves a **rating** and optional **review** of the seller.

### Why it exists

Trust layer for the next ukay buyer on the same store.

### How it works

1. After completion, prompt **Rate your experience**.
2. Buyer submits stars and text; review publishes per policy.

### Edge cases

- **Retaliation reviews:** moderation and appeals.
- **Buyer abandons:** optional reminder notification; no forced review.

---

## See also

- [LISTING_CREATION.md](../features/LISTING_CREATION.md) — how Dris are built, Spin view, negotiable toggle, couriers
- [CROSS_POSTING.md](../features/CROSS_POSTING.md) — social posts when item sells
- [SELLER_ONBOARDING.md](./SELLER_ONBOARDING.md) — how sellers set up shop and first Drip
