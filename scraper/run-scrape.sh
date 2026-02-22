#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

export PATH="/home/julian/.nvm/versions/node/v25.5.0/bin:$PATH"

echo "--- Scrape run: $(date -Iseconds) ---"
npx tsx scrape.ts
echo "--- Scrape complete: $(date -Iseconds) ---"

# Trim log if over 1MB
LOG_FILE="scrape.log"
if [ -f "$LOG_FILE" ] && [ "$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null)" -gt 1048576 ]; then
  tail -n 500 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi
