# DripNSole — PostgreSQL schema

PostgreSQL schema for the DripNSole Filipino thrift e-commerce marketplace.

## Table of contents

- [Extensions](#extensions)
- [ENUM types](#enum-types)
- [Tables](#tables)
  - [users](#users)
  - [reports](#reports)
  - [platform_settings](#platform_settings)
  - [stores](#stores)
  - [store_categories](#store_categories)
  - [listings](#listings)
  - [listing_photos](#listing_photos)
  - [categories](#categories)
  - [offers](#offers)
  - [reservations](#reservations)
  - [comments](#comments)
  - [conversations](#conversations)
  - [messages](#messages)
  - [wishlists](#wishlists)
  - [follows](#follows)
  - [reviews](#reviews)
  - [notifications](#notifications)
  - [social_connections](#social_connections)
- [See also](#see-also)

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## ENUM types

```sql
CREATE TYPE store_badge AS ENUM ('new', 'verified', 'top');

CREATE TYPE store_category AS ENUM (
  'Tops',
  'Bottoms',
  'Shoes',
  'Bags',
  'Accessories',
  'Vintage',
  'Luxury'
);

CREATE TYPE listing_category AS ENUM ('Clothes', 'Shoes');

CREATE TYPE listing_condition AS ENUM (
  'BNWT',
  'BNWOT',
  'VNDS',
  '9_10',
  '8_10',
  '7_10',
  'Thrifted'
);

CREATE TYPE size_unit AS ENUM ('EU', 'US', 'UK');

CREATE TYPE listing_availability AS ENUM ('available', 'reserved', 'sold');

CREATE TYPE listing_photo_slot AS ENUM (
  'front',
  'back',
  'left',
  'right',
  'sole_hem',
  'tag_label',
  'defect',
  'detail'
);

CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'countered', 'declined');

CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'expired', 'cancelled');

CREATE TYPE social_platform AS ENUM ('facebook', 'instagram');

CREATE TYPE notification_type AS ENUM (
  'new_comment',
  'new_dm',
  'new_offer',
  'offer_accepted',
  'offer_declined',
  'offer_countered',
  'reservation_confirmed',
  'reservation_expired',
  'new_listing_followed',
  'price_drop',
  'item_sold'
);

CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');

CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');

CREATE TYPE report_target AS ENUM ('listing', 'user');
```

## Tables

### users

`is_seller` was replaced by **`role user_role`** (default `buyer`). **`suspended_at`** gates login and `requireAuth`.

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  profile_pic text,
  role user_role NOT NULL DEFAULT 'buyer',
  email_verified boolean NOT NULL DEFAULT false,
  email_verification_token_hash text,
  email_verification_expires_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_created_at ON users (created_at DESC);
```

Migration: `apps/server/drizzle/0001_roles.sql` (adds enums/columns/tables below; maps legacy `is_seller` → `seller` before drop).

### reports

```sql
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  target_type report_target NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status report_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### platform_settings

Key/value JSONB for operational toggles (e.g. maintenance, limits, featured list, commission).

```sql
CREATE TABLE platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### stores

```sql
CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  handle text NOT NULL UNIQUE,
  name text NOT NULL,
  bio varchar(160),
  banner_url text,
  pickup_info text,
  shipping_info text,
  badge store_badge NOT NULL DEFAULT 'new',
  rating numeric(3, 2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  completed_transactions integer NOT NULL DEFAULT 0,
  follower_count integer NOT NULL DEFAULT 0,
  fb_connected boolean NOT NULL DEFAULT false,
  ig_connected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stores_badge ON stores (badge);
CREATE INDEX idx_stores_rating ON stores (rating DESC);
CREATE INDEX idx_stores_follower_count ON stores (follower_count DESC);
CREATE INDEX idx_stores_created_at ON stores (created_at DESC);
```

### store_categories

```sql
CREATE TABLE store_categories (
  store_id uuid NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
  category store_category NOT NULL,
  PRIMARY KEY (store_id, category)
);

CREATE INDEX idx_store_categories_category ON store_categories (category);
```

### listings

```sql
CREATE TABLE listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
  title text NOT NULL,
  category listing_category NOT NULL,
  subcategory text,
  condition listing_condition NOT NULL,
  size text,
  size_unit size_unit,
  measurements jsonb,
  price integer NOT NULL,
  negotiable boolean NOT NULL DEFAULT false,
  shipping_options text[] NOT NULL DEFAULT '{}',
  description text,
  availability listing_availability NOT NULL DEFAULT 'available',
  view_count integer NOT NULL DEFAULT 0,
  save_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_listings_price_non_negative CHECK (price >= 0)
);

CREATE INDEX idx_listings_store_id ON listings (store_id);
CREATE INDEX idx_listings_category ON listings (category);
CREATE INDEX idx_listings_availability ON listings (availability);
CREATE INDEX idx_listings_created_at ON listings (created_at DESC);
CREATE INDEX idx_listings_price ON listings (price);
CREATE INDEX idx_listings_store_availability ON listings (store_id, availability);
```

### listing_photos

```sql
CREATE TABLE listing_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  url text NOT NULL,
  slot listing_photo_slot NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_photos_listing_id ON listing_photos (listing_id);
CREATE INDEX idx_listing_photos_listing_order ON listing_photos (listing_id, "order");
```

### categories

```sql
CREATE TABLE categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  parent_id integer REFERENCES categories (id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_parent_id ON categories (parent_id);
CREATE INDEX idx_categories_name ON categories (name);
```

### offers

```sql
CREATE TABLE offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  amount integer NOT NULL,
  counter_amount integer,
  status offer_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_offers_amount_positive CHECK (amount > 0),
  CONSTRAINT chk_offers_counter_positive CHECK (counter_amount IS NULL OR counter_amount > 0)
);

CREATE INDEX idx_offers_listing_id ON offers (listing_id);
CREATE INDEX idx_offers_buyer_id ON offers (buyer_id);
CREATE INDEX idx_offers_seller_id ON offers (seller_id);
CREATE INDEX idx_offers_status ON offers (status);
CREATE INDEX idx_offers_created_at ON offers (created_at DESC);
CREATE INDEX idx_offers_listing_status ON offers (listing_id, status);
```

### reservations

```sql
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status reservation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_listing_id ON reservations (listing_id);
CREATE INDEX idx_reservations_buyer_id ON reservations (buyer_id);
CREATE INDEX idx_reservations_status ON reservations (status);
CREATE INDEX idx_reservations_expires_at ON reservations (expires_at);
CREATE INDEX idx_reservations_created_at ON reservations (created_at DESC);
```

### comments

```sql
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments (id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_listing_id ON comments (listing_id);
CREATE INDEX idx_comments_user_id ON comments (user_id);
CREATE INDEX idx_comments_parent_id ON comments (parent_id);
CREATE INDEX idx_comments_created_at ON comments (created_at DESC);
```

### conversations

```sql
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_conversations_listing_buyer UNIQUE (listing_id, buyer_id)
);

CREATE INDEX idx_conversations_listing_id ON conversations (listing_id);
CREATE INDEX idx_conversations_buyer_id ON conversations (buyer_id);
CREATE INDEX idx_conversations_seller_id ON conversations (seller_id);
CREATE INDEX idx_conversations_last_message_at ON conversations (last_message_at DESC NULLS LAST);
```

### messages

```sql
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content text NOT NULL,
  offer_id uuid REFERENCES offers (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX idx_messages_sender_id ON messages (sender_id);
CREATE INDEX idx_messages_offer_id ON messages (offer_id) WHERE offer_id IS NOT NULL;
CREATE INDEX idx_messages_created_at ON messages (conversation_id, created_at DESC);
```

### wishlists

```sql
CREATE TABLE wishlists (
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX idx_wishlists_listing_id ON wishlists (listing_id);
CREATE INDEX idx_wishlists_created_at ON wishlists (user_id, created_at DESC);
```

### follows

```sql
CREATE TABLE follows (
  follower_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, store_id)
);

CREATE INDEX idx_follows_store_id ON follows (store_id);
CREATE INDEX idx_follows_created_at ON follows (store_id, created_at DESC);
```

### reviews

```sql
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_reviews_rating_range CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_reviews_store_id ON reviews (store_id);
CREATE INDEX idx_reviews_listing_id ON reviews (listing_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews (reviewer_id);
CREATE INDEX idx_reviews_created_at ON reviews (created_at DESC);
CREATE INDEX idx_reviews_store_rating ON reviews (store_id, rating);
```

### notifications

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link_to text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications (type);
```

### social_connections

```sql
CREATE TABLE social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  account_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CONSTRAINT uq_social_connections_user_platform UNIQUE (user_id, platform)
);

CREATE INDEX idx_social_connections_user_id ON social_connections (user_id);
CREATE INDEX idx_social_connections_platform ON social_connections (platform);
```

## See also

- [MASTER_PROMPT.md](../MASTER_PROMPT.md) — product and build context
- [Features](../features/) — feature notes
- [Design](../design/) — design references
- [Business](../business/) — business docs
- [Flows](../flows/) — user flows
- [NotificationType](../../apps/web/src/types/notification.ts) — notification `type` values aligned with `notification_type`
