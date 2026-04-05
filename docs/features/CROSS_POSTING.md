# Cross-posting (Facebook & Instagram)

Cross-posting lets sellers push a **Drip** (listing) from DripNSole to **Facebook Page** and **Instagram Business** with one-time OAuth, editable captions, and optional bulk actions—meeting buyers where they already scroll for **ukay**, thrift, and sneaker deals in the Philippines.

---

## One-time OAuth: Facebook Page & Instagram Business

### What it is

A **single OAuth connect flow** that links the seller’s **Facebook Page** and **Instagram Business** account to DripNSole so the app can publish on their behalf.

### Why it exists

Filipino sellers rely on FB and IG for discovery; OAuth avoids password sharing and aligns with Meta’s supported integrations.

### How it works

1. Seller opens **Settings** or the cross-post prompt after publishing a Drip.
2. Seller taps **Connect Facebook / Instagram**.
3. Meta’s OAuth screen runs; seller selects the **Page** and approves scopes needed for posting (and IG if linked to that Page).
4. DripNSole stores tokens securely; future cross-posts do not repeat full login unless re-auth is required.

### Edge cases

- **OAuth token expiry:** expired or revoked tokens trigger **Reconnect**; queued posts fail until the seller reconnects.
- **Wrong Page selected:** seller disconnects and reconnects, or picks another Page if the product supports it.
- **IG not Business:** flow explains that IG must be a **Business/Creator** account linked to the FB Page.

---

## Auto-generated caption format

### What it is

A default caption assembled from: **item name + ₱price + size + condition + dripnsole.ph/@handle + hashtags** — e.g. `#thriftph #ukayukay #thriftfinds #dripnsole`.

### Why it exists

Consistency helps SEO-style discovery on social and drives traffic back to the authoritative **Drip** on site.

### How it works

1. On cross-post, the system builds the caption from live Drip fields (title, **PHP** price, size, condition, store handle/URL).
2. Hashtags reflect Filipino thrift culture: **#thriftph**, **#ukayukay**, **#thriftfinds**, **#dripnsole**.
3. Seller can **edit** the full caption before posting.

### Edge cases

- **Special characters in title:** escaping or length limits on IG/FB may truncate; preview before post.
- **Price change after draft caption:** re-sync from source of truth (Drip) when posting.

---

## Seller controls: caption & lead photo

### What it is

The seller may **edit the caption** and **swap the lead photo** (hero image) used for the social post.

### Why it exists

Creators know which angle sells; captions often need Taglish or extra meetup detail.

### How it works

1. In the cross-post composer, seller edits text and picks **Lead photo** from the Drip’s gallery / Spin sequence.
2. Preview shows FB vs IG constraints where relevant.
3. Seller confirms **Post**.

### Edge cases

- **Lead photo violates platform rules:** rare; seller picks another image from the Drip.

---

## Single and bulk post

### What it is

**Single post:** one Drip to FB/IG. **Bulk post:** up to **20 listings** in one action.

### Why it exists

Drop days and closet clear-outs need batch tools without spamming duplicate copy blindly.

### How it works

1. **Single:** from Drip detail or post-publish prompt, seller posts one item.
2. **Bulk:** seller selects up to **20** Dris from inventory, reviews per-item captions or applies a template, then submits.
3. Platform queues posts respecting API rules.

### Edge cases

- **Bulk post failures:** partial success is reported (which Drip succeeded/failed); seller retries failed items.
- **Rate limits (Meta API):** spacing or backoff; user sees “try again in X minutes” if throttled.

---

## Instagram carousel (up to 10 photos per item)

### What it is

For Instagram, a **carousel** post with **up to 10 photos** per Drip when the item has enough images.

### Why it exists

Carousels increase engagement; thrift buyers swipe through defects and tags.

### How it works

1. If the Drip has multiple images, IG flow suggests up to **10** in order; seller can reorder within the limit.
2. FB may use a single link preview or multi-photo depending on API and product choice.

### Edge cases

- **Fewer than 2 images:** carousel may fall back to single image.
- **Order mismatch with Spin view:** social order is independent of Spin sequence unless seller aligns them.

---

## When a Drip is marked Sold

### What it is

When the seller marks the item **Sold**, the platform either **adds a SOLD comment** on the social post or **edits the caption** to reflect sold status (per channel capability).

### Why it exists

Reduces ghosting and duplicate inquiries on old posts—common in busy ukay threads.

### How it works

1. Seller marks **Sold** on DripNSole.
2. If the Drip was cross-posted and linked, background jobs update FB/IG: **comment “SOLD”** and/or **prepend/append SOLD** to caption where editing is allowed.

### Edge cases

- **Post not linked:** no update on social; seller may manually mark.
- **Caption edit API failure:** retry queue; seller notified to edit manually.

---

## See also

- [LISTING_CREATION.md](./LISTING_CREATION.md) — Drip fields, photos, Spin view, publish prompt  
- [../flows/SELLER_ONBOARDING.md](../flows/SELLER_ONBOARDING.md) — optional FB/IG connect during store setup  
- [../flows/BUYER_PURCHASE.md](../flows/BUYER_PURCHASE.md) — negotiable price and completing a sale  
