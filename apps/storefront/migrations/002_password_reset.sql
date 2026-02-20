-- Password reset tokens
-- Run against the storefront database (DATABASE_URL):
--   psql "$DATABASE_URL" -f migrations/002_password_reset.sql

BEGIN;

CREATE TABLE IF NOT EXISTS password_reset_token (
    token_hash  TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token_user_id ON password_reset_token(user_id);

COMMIT;
