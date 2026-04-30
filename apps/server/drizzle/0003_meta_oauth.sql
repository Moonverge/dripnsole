ALTER TABLE stores DROP COLUMN IF EXISTS webhook_url;
ALTER TABLE stores DROP COLUMN IF EXISTS webhook_secret;
ALTER TABLE stores DROP COLUMN IF EXISTS webhook_connected_at;
ALTER TABLE stores DROP COLUMN IF EXISTS webhook_last_test_at;
ALTER TABLE stores DROP COLUMN IF EXISTS webhook_last_test_status;

ALTER TABLE stores ADD COLUMN meta_page_id TEXT;
ALTER TABLE stores ADD COLUMN meta_page_name TEXT;
ALTER TABLE stores ADD COLUMN meta_ig_user_id TEXT;
ALTER TABLE stores ADD COLUMN meta_page_token_encrypted TEXT;
ALTER TABLE stores ADD COLUMN meta_token_expires_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN meta_connected_at TIMESTAMPTZ;

DROP TABLE IF EXISTS social_connections;
