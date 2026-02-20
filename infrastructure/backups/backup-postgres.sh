#!/usr/bin/env bash
set -euo pipefail

# Postgres backup script — uses pg_dump with custom format + compression.
# Rotates local backups (default 30 days). Optionally uploads to S3.
#
# Required env: PGHOST, PGPORT, PGUSER, PGDATABASE (or DATABASE_URL)
# Optional env: BACKUP_DIR, BACKUP_RETENTION_DAYS, S3_BUCKET, S3_PREFIX

BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgres}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
FILENAME="ec1-${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting pg_dump at $(date -Iseconds)"

pg_dump \
  --format=custom \
  --compress=6 \
  --file="$BACKUP_DIR/$FILENAME"

FILESIZE=$(stat -f%z "$BACKUP_DIR/$FILENAME" 2>/dev/null || stat -c%s "$BACKUP_DIR/$FILENAME" 2>/dev/null)
echo "[backup] Created $FILENAME (${FILESIZE} bytes)"

# Rotate old backups
DELETED=$(find "$BACKUP_DIR" -name "ec1-*.dump" -mtime +"$RETENTION_DAYS" -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[backup] Rotated $DELETED backup(s) older than $RETENTION_DAYS days"
fi

# Optional S3 upload
if [ -n "${S3_BUCKET:-}" ] && command -v aws &>/dev/null; then
  S3_PREFIX="${S3_PREFIX:-backups/postgres}"
  echo "[backup] Uploading to s3://$S3_BUCKET/$S3_PREFIX/$FILENAME"
  aws s3 cp "$BACKUP_DIR/$FILENAME" "s3://$S3_BUCKET/$S3_PREFIX/$FILENAME" --quiet
  echo "[backup] S3 upload complete"
elif [ -n "${S3_BUCKET:-}" ]; then
  echo "[backup] WARNING: S3_BUCKET set but aws CLI not found — skipping upload"
fi

echo "[backup] Done at $(date -Iseconds)"
