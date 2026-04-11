CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');
CREATE TYPE report_target AS ENUM ('listing', 'user');

ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'buyer';
UPDATE users SET role = 'seller' WHERE is_seller = true;
ALTER TABLE users DROP COLUMN is_seller;

ALTER TABLE users ADD COLUMN suspended_at TIMESTAMPTZ;

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type report_target NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO platform_settings (key, value) VALUES
  ('maintenance_mode', 'false'),
  ('max_listings_per_seller', '0'),
  ('featured_sellers', '[]'),
  ('commission_rate', '0');
