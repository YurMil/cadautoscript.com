#!/usr/bin/env bash
# Post-deploy verification per GSC technical spec section 10.
# Fetches the live sitemap and asserts every URL is 200 OK with no redirect.
set -euo pipefail

SITEMAP_URL="${1:-https://cadautoscript.com/sitemap.xml}"
TMP_FILE="$(mktemp -t cadautoscript-sitemap.XXXXXX)"
trap 'rm -f "$TMP_FILE"' EXIT

echo "Fetching $SITEMAP_URL ..."
curl -sSL "$SITEMAP_URL" -o "$TMP_FILE"

fail=0
total=0
while read -r url; do
  [ -z "$url" ] && continue
  total=$((total + 1))
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  redirect_url=$(curl -s -o /dev/null -w "%{redirect_url}" "$url")

  if [ "$code" != "200" ]; then
    echo "FAIL: $url returned $code"
    fail=1
    continue
  fi
  if [ -n "$redirect_url" ]; then
    echo "FAIL: $url redirects to $redirect_url"
    fail=1
    continue
  fi
done < <(grep -oE '<loc>[^<]+' "$TMP_FILE" | sed 's#<loc>##')

if [ "$fail" -ne 0 ]; then
  echo "Sitemap verification FAILED ($total URLs checked)."
  exit 1
fi

echo "Sitemap verification OK ($total URLs)."
