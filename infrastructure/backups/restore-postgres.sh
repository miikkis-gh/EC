#!/usr/bin/env bash
set -euo pipefail

# Postgres restore script — restores from a pg_dump custom-format file.
# Drops and recreates objects (--clean --if-exists) in the target database.
#
# Required env: PGHOST, PGPORT, PGUSER, PGDATABASE (or DATABASE_URL)
# Usage: ./restore-postgres.sh <backup-file.dump>

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup-file.dump>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: file not found: $BACKUP_FILE"
  exit 1
fi

DB_NAME="${PGDATABASE:-ec1}"

echo "WARNING: This will restore $BACKUP_FILE into database '$DB_NAME'."
echo "Existing data will be overwritten."
echo ""
read -rp "Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "[restore] Starting pg_restore at $(date -Iseconds)"

pg_restore \
  --clean \
  --if-exists \
  --dbname="$DB_NAME" \
  "$BACKUP_FILE"

echo "[restore] Restore complete at $(date -Iseconds)"
