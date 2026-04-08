# Listing creation (Drip)

DripNSole uses **Drip** for a seller’s listing—an item for sale (**Clothes** or **Sole**). This document describes how sellers create a Drip from photos through publish, including **Spin view** (3D-style rotation from photos) and listing fields tuned for ukay-ukay and thrift culture in the Philippines.

---

## Guided photo upload (shot list)

### What it is

A step-by-step upload flow that asks for specific angles: **Front, Back, Left, Right, Sole/Hem, Tag/Label, Defect, Detail**. Sellers upload **minimum 3, maximum 8** photos.

### Why it exists

Thrift and ukay buyers need to trust condition and authenticity without seeing the piece in person. A consistent shot list reduces vague listings and disputes. Sole/Hem shots matter for shoes (**Sole**) and for hems on clothes; defects and tags are called out explicitly.

### How it works

1. Seller starts “Create Drip” from their store or onboarding.
2. The app shows the guided shot list in order (or lets the seller map each upload to a slot).
3. Seller adds photos until they meet **at least 3** and **at most 8** images.
4. Each slot can be filled or skipped where the flow allows; the system enforces the global min/max on total photos.

### Edge cases

- **Fewer than 3 photos:** publish is blocked until the minimum is met.
- **More than 8 photos:** uploads beyond 8 are rejected or the UI prevents adding more.
- **Wrong angle in a slot:** seller can replace an image; validation is on count and required slots if the product enforces them.

---

## Spin view generation

### What it is

**Spin view** is a photo-based rotation viewer: multiple angles are composed so the buyer can **drag to spin** the item. In the feed, Spin view can **auto-play** to catch attention.

### Why it exists

Flat thumbnails hide shape and wear. Spin view approximates picking up the item—important for sneakers, jackets, and bags—while staying lightweight (no heavy 3D model upload for most sellers).

### How it works

1. After the seller uploads the multi-angle set, the platform generates the Spin view sequence from those photos.
2. On listing cards and detail pages, the buyer **drags** (or swipes) to rotate through the sequence.
3. In the **feed**, Spin view **auto-plays** on the card according to product rules (e.g., loop, timing).

### Edge cases

- **Too few angles:** Spin view may degrade to a simple carousel or a single hero image; the UX should still work.
- **Very different lighting between shots:** rotation may look jumpy; sellers are encouraged to use consistent lighting in the guided flow.
- **Performance on low-end phones:** auto-play in feed may be reduced or paused when off-screen to save battery.

---

## Listing fields

### What it is

Structured metadata for each Drip: discoverability, fit, condition, price in **PHP**, shipping, and story.

### Why it exists

Buyers filter by category, size, and condition; couriers (**Lalamove**, **LBC**, **J&T**) match how Filipinos actually receive parcels. Clear fields reduce “PM for details” loops.

### How it works

| Field                | Behavior                                                                          |
| -------------------- | --------------------------------------------------------------------------------- |
| **Title**            | Short, searchable name of the item.                                               |
| **Category**         | **Clothes** or **Sole** (shoes and footwear).                                     |
| **Subcategory**      | e.g., tees, sneakers (exact list is defined in the app).                          |
| **Condition**        | **BNWT, BNWOT, VNDS, 9/10, 8/10, 7/10, Thrifted**—common resale/thrift shorthand. |
| **Standard size**    | Apparel: **XS–5XL**; shoes: **EU / US / UK** as applicable.                       |
| **Measurements**     | In **cm** for clothes (and shoe length where collected).                          |
| **Price**            | Amount in **PHP**.                                                                |
| **Negotiable**       | Toggle; when on, buyers can make offers (see purchase flow).                      |
| **Shipping options** | **Lalamove**, **LBC**, **J&T**—seller indicates what they support.                |
| **Description**      | Free text: flaws, fit notes, story, meetup notes in DM.                           |

**Availability** defaults to **Available** until the seller marks the item sold or delists it.

### Edge cases

- **Category vs. subcategory mismatch:** validation should prevent impossible pairs or warn the seller.
- **Measurements missing for fitted items:** optional vs. required is a product decision; if required, block publish until filled.
- **Multiple courier toggles off:** seller must still align with buyer in chat for actual booking.

---

## Publish and cross-post prompt

### What it is

After a successful publish, the seller sees a **cross-post** prompt to share the Drip on Facebook and Instagram (see [CROSS_POSTING.md](./CROSS_POSTING.md)).

### Why it exists

Many Filipino sellers already move inventory on social; DripNSole surfaces the action at the right moment.

### How it works

1. Seller taps **Publish** when validation passes.
2. The Drip goes live on **dripnsole.ph** (or the canonical URL pattern).
3. A modal or screen offers **Cross-post to Facebook / Instagram** (if connected) or **Connect accounts**.

### Edge cases

- **Accounts not connected:** prompt deep-links to OAuth setup or skips with “Later.”
- **Publish API failure:** Drip is not live; user sees error and can retry without losing drafts if drafts exist.

---

## Validation summary (edge cases)

| Area                | Rule                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Minimum photos**  | At least **3** images required to publish.                                                                           |
| **Maximum photos**  | At most **8** images.                                                                                                |
| **Required fields** | Title, category, condition, price, and other fields marked required in-app must be complete.                         |
| **Price**           | Valid **PHP** amount: positive number, within min/max if the platform enforces caps; no empty or zero if disallowed. |

---

## See also

- [CROSS_POSTING.md](./CROSS_POSTING.md) — Facebook and Instagram cross-posting after publish
- [../flows/SELLER_ONBOARDING.md](../flows/SELLER_ONBOARDING.md) — store setup and first Drip
- [../flows/BUYER_PURCHASE.md](../flows/BUYER_PURCHASE.md) — how buyers view Spin view, negotiate, and complete a sale
