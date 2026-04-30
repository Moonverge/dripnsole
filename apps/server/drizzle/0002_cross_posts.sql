CREATE TYPE cross_post_status AS ENUM ('posting', 'posted', 'failed', 'removed');

ALTER TABLE stores
  ADD COLUMN webhook_url TEXT,
  ADD COLUMN webhook_secret TEXT,
  ADD COLUMN webhook_connected_at TIMESTAMPTZ,
  ADD COLUMN webhook_last_test_at TIMESTAMPTZ,
  ADD COLUMN webhook_last_test_status TEXT;

CREATE TABLE cross_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  status cross_post_status NOT NULL DEFAULT 'posting',
  caption TEXT NOT NULL,
  remote_post_id TEXT,
  remote_url TEXT,
  error_message TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cross_posts_listing_platform ON cross_posts (listing_id, platform, created_at DESC);
CREATE INDEX idx_cross_posts_seller_created ON cross_posts (seller_id, created_at DESC);
