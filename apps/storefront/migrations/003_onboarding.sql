-- Onboarding tracking
-- Run against the storefront database (DATABASE_URL):
--   psql "$DATABASE_URL" -f migrations/003_onboarding.sql

BEGIN;

ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- Backfill existing users as already onboarded
UPDATE auth_user SET onboarded_at = created_at WHERE onboarded_at IS NULL;

COMMIT;
