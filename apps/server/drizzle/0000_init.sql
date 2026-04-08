CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

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

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  profile_pic text,
  is_seller boolean NOT NULL DEFAULT false,
  email_verified boolean NOT NULL DEFAULT false,
  email_verification_token_hash text,
  email_verification_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_created_at ON users (created_at DESC);

CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  family_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  replaced_at timestamptz,
  invalidated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens (family_id);

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

CREATE TABLE store_categories (
  store_id uuid NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
  category store_category NOT NULL,
  PRIMARY KEY (store_id, category)
);

CREATE INDEX idx_store_categories_category ON store_categories (category);

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
  deleted_at timestamptz,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(subcategory, '')
    )
  ) STORED,
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
CREATE INDEX idx_listings_search_vector ON listings USING gin (search_vector);
CREATE INDEX idx_listings_deleted_at ON listings (deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE listing_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings (id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES users (id) ON DELETE SET NULL,
  url text NOT NULL,
  slot listing_photo_slot NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_photos_listing_id ON listing_photos (listing_id);
CREATE INDEX idx_listing_photos_listing_order ON listing_photos (listing_id, "order");
CREATE INDEX idx_listing_photos_uploaded_by ON listing_photos (uploaded_by);

CREATE TABLE categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  parent_id integer REFERENCES categories (id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_parent_id ON categories (parent_id);
CREATE INDEX idx_categories_name ON categories (name);

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

CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status reservation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_reservations_pending_listing ON reservations (listing_id) WHERE status = 'pending';

CREATE INDEX idx_reservations_listing_id ON reservations (listing_id);
CREATE INDEX idx_reservations_buyer_id ON reservations (buyer_id);
CREATE INDEX idx_reservations_status ON reservations (status);
CREATE INDEX idx_reservations_expires_at ON reservations (expires_at);
CREATE INDEX idx_reservations_created_at ON reservations (created_at DESC);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments (id) ON DELETE CASCADE,
  content text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_listing_id ON comments (listing_id);
CREATE INDEX idx_comments_user_id ON comments (user_id);
CREATE INDEX idx_comments_parent_id ON comments (parent_id);
CREATE INDEX idx_comments_created_at ON comments (created_at DESC);

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

CREATE TABLE wishlists (
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX idx_wishlists_listing_id ON wishlists (listing_id);
CREATE INDEX idx_wishlists_created_at ON wishlists (user_id, created_at DESC);

CREATE TABLE follows (
  follower_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, store_id)
);

CREATE INDEX idx_follows_store_id ON follows (store_id);
CREATE INDEX idx_follows_created_at ON follows (store_id, created_at DESC);

CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_listing_id ON transactions (listing_id);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions (id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_reviews_rating_range CHECK (rating >= 1 AND rating <= 5)
);

CREATE UNIQUE INDEX uq_reviews_transaction_reviewer ON reviews (transaction_id, reviewer_id)
  WHERE transaction_id IS NOT NULL;

CREATE INDEX idx_reviews_store_id ON reviews (store_id);
CREATE INDEX idx_reviews_listing_id ON reviews (listing_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews (reviewer_id);
CREATE INDEX idx_reviews_created_at ON reviews (created_at DESC);
CREATE INDEX idx_reviews_store_rating ON reviews (store_id, rating);

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

CREATE TABLE social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  access_token_enc text NOT NULL,
  refresh_token_enc text,
  account_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CONSTRAINT uq_social_connections_user_platform UNIQUE (user_id, platform)
);

CREATE INDEX idx_social_connections_user_id ON social_connections (user_id);
CREATE INDEX idx_social_connections_platform ON social_connections (platform);
