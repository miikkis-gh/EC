-- Cleanup unfinished registrations
-- Deletes users who registered but never completed onboarding within 24 hours.
-- Run periodically (e.g. daily cron):
--   psql "$DATABASE_URL" -f scripts/cleanup-unfinished-registrations.sql

BEGIN;

DELETE FROM auth_user
WHERE onboarded_at IS NULL
  AND created_at < NOW() - INTERVAL '24 hours';

COMMIT;
