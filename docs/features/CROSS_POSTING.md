# Cross-Posting to Facebook & Instagram

DripNSole lets sellers push their listings to **Facebook Page** and **Instagram Business** with one tap — without DripNSole ever touching Meta directly. We use **Make.com** as the integration layer, the seller authorizes their own social accounts inside Make, and DripNSole simply fires a webhook when the seller chooses to post.

Posting is **always opt-in and manual**. Nothing is ever cross-posted automatically.

---

## Principles

1. **Manual, not automatic.** A listing is never cross-posted just because it was published. The seller decides when (and whether) to post.
2. **Per-listing choice.** For every post action, the seller picks which platforms to send to (FB, IG, or both) and edits the caption for that specific item.
3. **Repost anytime.** Sellers can re-post any listing — single or in bulk — from their dashboard, with a fresh caption.
4. **Make.com handles the social side.** DripNSole never stores Meta tokens, never goes through Meta App Review, and never touches the Graph API directly. Make is already approved by Meta; we ride that approval.
5. **Status is tracked.** Every cross-post attempt is recorded so the seller can see what was posted, where, and when.

---

## How a Seller Connects Their Socials (one-time, ~3 minutes)

The seller uses Make.com as a connector. They do this once per store.

1. Seller opens **Dashboard → Settings → Connections**.
2. Clicks **"Connect Facebook & Instagram via Make.com"**.
3. DripNSole opens the official **DripNSole Make.com template** in a new tab.
4. Seller signs in to Make (Google login, free account).
5. Make walks them through:
   - Allow Facebook Page access (Meta's standard popup)
   - Allow Instagram Business access (Meta's standard popup)
   - Activate the scenario
6. Make displays a unique **webhook URL** at the top of the scenario.
7. Seller copies that URL and pastes it back into DripNSole.
8. DripNSole fires a test payload. If Make accepts it, both platforms are marked **Connected ✓**.

After this, the seller never has to touch Make again unless their Meta token expires (~every 60 days, Make notifies them by email).

### Edge cases

- **Seller doesn't have IG Business**: We show a help link explaining how to switch a personal IG to Business in 30 seconds.
- **Seller's IG isn't linked to their FB Page**: Required by Meta. Help link explains how.
- **Seller skips Make connection entirely**: All "Post to FB/IG" buttons remain visible but, when clicked, open the connection modal first.

---

## Posting Flow #1: After Publishing a New Listing

After a seller publishes a listing, the success screen offers a choice — it does not auto-open a posting modal.

### What the seller sees

```
✓ Listing published

Your drip is live on dripnsole.ph/listing/abc123

  [ Post to Facebook & Instagram ]    [ Maybe later ]
```

- **Maybe later** → toast: "You can post to social anytime from your Listings tab." Returns to the listings dashboard.
- **Post to Facebook & Instagram** → opens the **Cross-Post Composer** with this listing pre-loaded.

### Edge cases

- **Seller has no Make connection** → button text becomes **"Connect FB & IG to post"** and opens the Connections modal first.

---

## Posting Flow #2: Posting an Existing Listing (single)

Available from two places:

1. **Dashboard → Listings tab** — every row has a small share icon; click → opens Composer for that listing.
2. **Listing detail page (seller view only)** — a "Post to social" button next to the availability dropdown.

The Composer behaves identically to Flow #1, just pre-loaded with the chosen listing.

---

## Posting Flow #3: Bulk Posting

For drop days and closet clear-outs.

### What the seller sees

1. From **Dashboard → Listings**, seller checks the boxes next to multiple listings (max **20** per batch).
2. Action bar appears: **"Post 7 to FB/IG"**.
3. Clicking opens the **Bulk Composer**:

```
Post 7 listings to social

Post to:
[✓] Facebook Page (@ThriftByKath)
[✓] Instagram Business (@thriftbykath)

Listings (7):
┌─────────────────────────────────────────────┐
│ [✓] [🖼] Vintage Air Max 97  · ₱4,500       │
│        Caption: ✎ "🔥 Vintage Air Max 97…"  │
├─────────────────────────────────────────────┤
│ [✓] [🖼] Supreme Box Logo    · ₱6,500       │
│        Caption: ✎ "BNWT Supreme Box Logo…"  │
├─────────────────────────────────────────────┤
│ [ ] [🖼] Jordan 1 Chicago    · ₱12,000      │
│        Caption: ✎ "Jordan 1 Retro Chicago…" │
└─────────────────────────────────────────────┘

Posting interval: every 30 seconds (avoids Meta rate limits)

[ Cancel ]                         [ Post 6 listings ]
```

### Bulk rules

- Each listing has its **own editable caption**, pre-filled from the auto-generate template.
- Seller can uncheck individual rows inside the bulk modal.
- Platform selection (FB / IG / both) is **shared across all items in the batch** — sellers wanting different platforms per item should post them separately.
- Posts are queued server-side and fired to Make with a **30-second interval** to stay safe with Meta's rate limits.
- The modal closes after firing; status appears as a toast: "Posting 6 listings in the background — see Listings tab for status."

### Edge cases

- **>20 selected** → "Bulk post is limited to 20 listings at a time." Selection capped.
- **Mixed connection states** → If some listings belong to a sub-store with a different connection (future feature), warn before posting.
- **One listing fails mid-batch** → other listings continue. Failed ones marked failed and visible for retry.

---

## Posting Flow #4: Repost (single or bulk)

A repost is just a fresh cross-post of an existing listing. Useful when the FB/IG post got buried, the seller dropped the price, or it's a new week and they want fresh visibility.

### Single repost

- On a listing already showing **Posted ✓**, the share icon shows **"Re-post"**.
- Clicking opens the Composer with the **previous caption pre-filled** (so the seller can tweak rather than rewrite).
- Posting creates a **new** FB/IG post — the old one is left alone.

### Bulk repost

- Same selection UI as bulk post.
- Selected listings can be a mix of "never posted" and "previously posted" — the action label updates: **"Post 5 (3 reposts, 2 new)"**.
- Each listing's caption is independently editable in the composer, pre-filled with whatever was last used.

### Edge cases

- **Seller spam-clicks Re-post** → server enforces a 5-minute cooldown per listing.
- **Caption template was changed since last post** → seller can pick **Reset to current template** to refresh.

---

## The Cross-Post Composer (single-item)

This is the modal that opens for any single-listing post action.

```
┌─────────────────────────────────────────────┐
│  Post "Vintage Nike Air Max 97" to social   │
├─────────────────────────────────────────────┤
│                                             │
│  Post to:                                   │
│  [✓] Facebook Page (@ThriftByKath)          │
│  [✓] Instagram Business (@thriftbykath)     │
│                                             │
│  Caption:                                   │
│  ┌────────────────────────────────────────┐ │
│  │ 🔥 Vintage Nike Air Max 97             │ │
│  │ ₱4,500 · VNDS · Size US 10             │ │
│  │                                        │ │
│  │ Cop here → dripnsole.ph/@ThriftByKath  │ │
│  │ #thriftph #ukayukay #airmax97          │ │
│  └────────────────────────────────────────┘ │
│  [ Reset to template ]   320 / 2200 chars   │
│                                             │
│  Photos to post:                            │
│  [🖼][🖼][🖼][🖼]   (drag to reorder)        │
│                                             │
│  ⓘ FB posts up to 10 photos. IG carousel    │
│    posts the first 10 in the order shown.   │
│                                             │
│  [ Cancel ]                  [ Post now ]   │
└─────────────────────────────────────────────┘
```

### Composer rules

- **Default platform checks** = whichever the seller has connected. Disconnected platforms greyed out with a "Connect" link.
- **Caption** is auto-generated from the template (`title + ₱price + condition + size + storefront URL + hashtags`) and **always editable**. Edits affect this post only.
- **Reset to template** restores the auto-generated default.
- **Character counter** shows the most restrictive limit (Instagram = 2,200).
- **Photo order is editable**. Default order matches the listing's photo order.
- **Post now** is disabled if zero platforms are checked or the caption is empty.
- No "Schedule for later" in v1 (planned for v2).

---

## Auto-Generated Caption Template

Default caption format:

```
{emoji} {title}
₱{price} · {condition} · Size {size}{sizeUnit}

Cop here → dripnsole.ph/@{handle}
#thriftph #ukayukay #{categoryHashtag} #dripnsole
```

- `{emoji}` rotates: 🔥 / ✨ / 👀 / 🛒 (random per post)
- `{categoryHashtag}` derived from category + subcategory (e.g. `#airmax97`, `#bapehoodie`, `#vintagetee`)
- Sellers can override the entire template **per post** via the editor.
- Future: a "Default caption template" per store under Settings, used for auto-fill across all listings.

---

## Cross-Post Status (per listing, per platform)

Each listing tracks status separately for FB and IG:

| Status     | Meaning                                   | Where shown                |
| ---------- | ----------------------------------------- | -------------------------- |
| `unposted` | Never cross-posted on this platform       | "Post" button              |
| `posting`  | Webhook fired, awaiting confirmation      | Spinner                    |
| `posted`   | Successfully posted; we have the post URL | ✓ pill + "View on FB/IG ↗" |
| `failed`   | Webhook failed or Make returned error     | ❌ pill + reason + "Retry" |
| `removed`  | Seller manually removed from FB/IG        | Greyed out                 |

### Where status appears

- **Listings tab row**: small pill `🟦 FB · 🟪 IG` (hover for "Posted 3h ago"), or `🔴 IG failed` for partial failures.
- **Listing detail (seller view)**: full history — every cross-post attempt with timestamp, caption used, link to the live post.

---

## When a Listing is Marked SOLD

The seller is given the choice — never automatic.

1. Seller toggles availability to **Sold**.
2. If the listing was previously cross-posted, a small follow-up modal asks:
   ```
   You marked this SOLD on DripNSole.
   Update your FB and IG posts too?
     [✓] Comment "SOLD ✅" on the FB post
     [✓] Comment "SOLD ✅" on the IG post
     [ Skip ]    [ Update ]
   ```
3. On confirm, DripNSole fires a `listing.sold` webhook to Make with the stored `post_id`. Make's template adds the SOLD comment.

### Edge cases

- **Listing wasn't cross-posted** → no modal appears.
- **Make scenario errors on the comment step** → seller is notified and can retry or comment manually.

---

## What DripNSole Sends to Make (webhook payload)

Every cross-post action fires a single HMAC-signed POST to the seller's webhook URL.

```json
{
  "event": "listing.cross_post",
  "timestamp": "2026-04-17T10:30:00Z",
  "seller": {
    "id": "uuid",
    "handle": "ThriftByKath"
  },
  "listing": {
    "id": "uuid",
    "title": "Vintage Nike Air Max 97",
    "price": 4500,
    "currency": "PHP",
    "url": "https://dripnsole.ph/listing/abc123",
    "photos": ["https://cdn.dripnsole.ph/.../1.jpg", "https://cdn.dripnsole.ph/.../2.jpg"]
  },
  "post": {
    "platforms": ["facebook", "instagram"],
    "caption": "🔥 Vintage Nike Air Max 97\n₱4,500 · VNDS · Size US 10\n\nCop here → dripnsole.ph/@ThriftByKath\n#thriftph #ukayukay #airmax97",
    "cross_post_id": "uuid"
  }
}
```

Other events:

- `event: "listing.sold"` — adds a SOLD comment, includes `post_id` per platform from the original cross-post.
- `event: "listing.removed"` — optional; deletes the FB/IG post.
- `event: "test"` — sent by the "Test Connection" button.

---

## What Make Sends Back

The Make template's last step returns:

```json
{
  "ok": true,
  "results": {
    "facebook": {
      "status": "posted",
      "post_id": "12345_67890",
      "url": "https://facebook.com/ThriftByKath/posts/67890"
    },
    "instagram": {
      "status": "posted",
      "media_id": "abc123",
      "url": "https://instagram.com/p/xyz/"
    }
  }
}
```

If a platform fails:

```json
{
  "ok": true,
  "results": {
    "facebook": { "status": "posted", "post_id": "...", "url": "..." },
    "instagram": { "status": "failed", "error": "Image too large (>8MB)" }
  }
}
```

DripNSole stores both results and surfaces them per-platform in the UI.

---

## Rate Limits & Throttling

To stay within Make's free tier (1,000 ops/month) and Meta's posting limits:

| Limit                     | Value                  |
| ------------------------- | ---------------------- |
| Per listing, per platform | 1 post every 5 minutes |
| Per seller, per hour      | 30 cross-posts         |
| Per seller, per day       | 50 cross-posts         |
| Bulk batch size           | 20 listings per submit |
| Bulk inter-post delay     | 30 seconds             |

Hitting a limit shows a clear message — never silently fails.

---

## Storage Model (DB)

A `cross_posts` table tracks every attempt:

| Column         | Type      | Notes                                       |
| -------------- | --------- | ------------------------------------------- |
| id             | uuid      | PK                                          |
| listing_id     | uuid      | FK                                          |
| seller_id      | uuid      | FK                                          |
| platform       | enum      | `facebook` / `instagram`                    |
| status         | enum      | `posting` / `posted` / `failed` / `removed` |
| caption        | text      | Snapshot of what was posted                 |
| remote_post_id | text      | From Make response, used for SOLD comments  |
| remote_url     | text      | Direct link to the FB/IG post               |
| error_message  | text      | Nullable                                    |
| posted_at      | timestamp | Nullable until success                      |
| created_at     | timestamp | When seller hit Post                        |

A listing's "current state" pill is derived from its most recent `cross_posts` row per platform.

---

## What's Out of Scope (v1)

- ❌ **Auto-posting on publish** — never. Always seller-initiated.
- ❌ **Scheduled posts** (e.g. "post tomorrow at 7pm") — planned for v2.
- ❌ **Stories or Reels** — feed posts only.
- ❌ **TikTok / Twitter / Threads** — Make supports them but Meta is the wedge.
- ❌ **Multiple FB Pages or IG accounts per store** — one Page + one IG per store.
- ❌ **Editing a previously cross-posted FB/IG post from DripNSole** — seller does that on FB/IG itself, or reposts.
- ❌ **Native Meta Graph API integration** — revisit only after >500 active sellers.

---

## See Also

- [LISTING_CREATION.md](./LISTING_CREATION.md) — the listing flow that precedes any cross-post.
- [../flows/SELLER_ONBOARDING.md](../flows/SELLER_ONBOARDING.md) — where the seller can optionally connect Make during initial setup.
- [../tech/FACEBOOK_API.md](../tech/FACEBOOK_API.md) and [../tech/INSTAGRAM_API.md](../tech/INSTAGRAM_API.md) — Meta-side reference for what Make is doing under the hood.
