# Seller onboarding flow

End-to-end steps for a new user who wants to sell thrift clothes and shoes on **DripNSole**, from account creation through first **Drip** (listing) and first **cross-post**. Terminology: **Drip** = listing, **Spin view** = drag-to-spin photo viewer, **Sole** = shoe category.

---

## 1. Account creation (email + password)

### What it is

Registration with **email** and **password** to create a DripNSole account.

### Why it exists

A stable identity is required for store URL, payouts communication, and trust on a **PHP**-priced marketplace.

### How it works

1. User opens sign-up (web or app).
2. User enters email, password, and any required confirmations.
3. User submits; account is created (and verified if email verification is enabled).

### Edge cases

- **Duplicate email:** show clear error and suggest login or password reset.
- **Weak password:** enforce policy and show requirements.

---

## 2. “Do you want to sell?” prompt after registration

### What it is

Right after registration, a prompt asks whether the user wants to **sell** or **browse only**.

### Why it exists

Separates buyers from sellers early so UX does not force store setup on everyone.

### How it works

1. After successful registration, show **Do you want to sell?**
2. **Yes** → continue to store setup (step 3).
3. **No** → land on browse/explore; user can start selling later from profile/settings.

### Edge cases

- **Dismiss without choice:** default to buyer home; selling remains available in settings.

---

## 3. Store setup — step 1: Handle, uniqueness, preview URL

### What it is

Seller chooses a **public handle** (e.g., `@banigthrifts`) used in URLs and cross-post captions.

### Why it exists

Shareable **dripnsole.ph/@handle** links are core to Filipino social selling.

### How it works

1. Seller enters desired handle.
2. System **validates uniqueness** in real time or on submit.
3. System shows **preview URL** (e.g., `https://dripnsole.ph/@handle`).
4. Seller confirms and continues.

### Edge cases

- **Taken handle:** suggest alternatives or allow variations.
- **Invalid characters:** block or sanitize per platform rules.

---

## 4. Store setup — step 2: Banner, name, bio, categories, pickup/shipping

### What it is

Store branding and logistics defaults: **banner**, **store name**, **bio**, **categories** they sell, **pickup** and **shipping** preferences (**Lalamove**, **LBC**, **J&T**).

### Why it exists

Buyers decide fast; ukay sellers often mix meetup **COD** with courier drop-offs.

### How it works

1. Seller uploads **banner** and sets **store name** and **bio** (voice, area, schedule).
2. Seller selects **categories** (e.g., clothes, **Sole**).
3. Seller toggles **pickup** and default **shipping** options they support.
4. Seller saves and continues.

### Edge cases

- **Oversized banner file:** compress or reject with size guidance.
- **No shipping selected:** allow if meetup-only; warn that buyer reach may be local.

---

## 5. Store setup — step 3: Connect Facebook / Instagram via Make.com (optional, skippable)

### What it is

Optional **Make.com integration** that lets the seller cross-post their listings to **Facebook Page** and **Instagram Business** later. DripNSole never touches Meta directly — Make is the connector and the seller authorizes their own social accounts inside Make.

### Why it exists

Many sellers already move stock on IG; setting this up during onboarding avoids friction at first publish. Going through Make means no Meta App Review wall and no token management on DripNSole's side.

### How it works

1. Seller sees **Connect Facebook & Instagram via Make.com** with a 60-second explainer video and the benefit copy ("post to FB + IG with one tap").
2. **Connect** → opens the official **DripNSole Make template** in a new tab.
3. Seller signs in to Make (Google, free), the template auto-loads, Make walks them through Meta's standard OAuth popups for Page + IG Business, and gives them a unique **webhook URL**.
4. Seller pastes the webhook URL back into DripNSole.
5. DripNSole fires a **test payload**; if Make accepts (200), both platforms flip to **Connected ✓**.
6. **Skip for now** → store setup continues; the seller can connect later from **Settings → Connections** or the first time they hit "Post to FB/IG".

### Edge cases

- **Seller closes the Make tab without finishing:** the connection state stays "Not connected"; they can retry anytime from Settings.
- **Test payload fails:** show the Make-side error (e.g. "Scenario inactive — toggle it on") and a "Re-test" button.
- **IG isn't a Business account or isn't linked to the FB Page:** Meta will reject inside Make. We surface a help link explaining the one-time fix in the IG app.
- **Meta token expires (~60 days):** Make emails the seller. Next failed cross-post on DripNSole shows a banner: "Reconnect your scenario in Make".
- Full behavior is documented in [CROSS_POSTING.md](../features/CROSS_POSTING.md).

---

## 6. Store setup — step 4: Confirmation — “Your store is live”

### What it is

A confirmation screen that the **store is live** on DripNSole.

### Why it exists

Clear milestone reduces “did it save?” anxiety and transitions to first listing.

### How it works

1. After prior steps complete, show success: **Your store is live**.
2. Primary CTA: **Create your first Drip** (or equivalent).
3. Secondary: **Explore** or **Share store link**.

### Edge cases

- **Backend save failure:** do not show live; show retry.

---

## 7. First listing walkthrough

### What it is

Guided experience to create the first **Drip**: guided photo shot list (Front, Back, Left, Right, Sole/Hem, Tag/Label, Defect, Detail), **min 3 max 8** photos, **Spin view**, fields (title, category **Clothes** or **Sole**, condition, size, **PHP** price, negotiable, couriers, description).

### Why it exists

First success determines if the seller returns; aligns with **ukay** norms (honest defects, clear tags).

### How it works

1. Prompt opens **Create Drip** with short tips.
2. Seller completes upload and fields per [LISTING_CREATION.md](../features/LISTING_CREATION.md).
3. Seller publishes; **Availability** defaults to **Available**.

### Edge cases

- **Validation errors:** minimum photos, required fields, price in **PHP** — see listing doc.

---

## 8. First cross-post (opt-in)

### What it is

After first publish, the success screen **offers** the seller a chance to cross-post to Facebook and/or Instagram. **Nothing posts automatically** — the seller chooses whether and where to post.

### Why it exists

Closes the loop from DripNSole to social discovery without surprising the seller. Manual choice respects sellers who only want a branded storefront and don't want every drop blasted to their feed.

### How it works

1. After publish, show:
   ```
   ✓ Listing published
   [ Post to Facebook & Instagram ]   [ Maybe later ]
   ```
2. **Post** → opens the Cross-Post Composer with platforms (FB / IG / both) toggleable and the auto-generated caption editable for this specific item.
3. **Maybe later** → returns to the dashboard with a toast pointing to the **Listings tab**, where the seller can post (or repost) anytime, single or in bulk up to 20 items.
4. **Not yet connected to Make** → the post button instead opens the Connections modal first; once connected, returns to the composer.

### Edge cases

- **Seller skips and never posts:** that's fine — the listing still lives at `dripnsole.ph/@handle/listing/...` and is discoverable on-platform.
- **Bulk and repost flows, per-item caption editing, SOLD-state behavior, rate limits:** all defined in [CROSS_POSTING.md](../features/CROSS_POSTING.md).

---

## See also

- [LISTING_CREATION.md](../features/LISTING_CREATION.md) — full Drip creation, Spin view, validation
- [CROSS_POSTING.md](../features/CROSS_POSTING.md) — Make.com setup, per-item captions, single + bulk + repost flows, sold-state updates
- [BUYER_PURCHASE.md](./BUYER_PURCHASE.md) — how buyers find Dris and complete a purchase
