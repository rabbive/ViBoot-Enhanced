#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-$ROOT_DIR/dist/safari-extension}"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/js" "$OUT_DIR/html" "$OUT_DIR/service_worker" "$OUT_DIR/assets"

cp -R "$ROOT_DIR/js/." "$OUT_DIR/js/"
cp -R "$ROOT_DIR/html/." "$OUT_DIR/html/"
cp -R "$ROOT_DIR/service_worker/." "$OUT_DIR/service_worker/"
cp -R "$ROOT_DIR/assets/." "$OUT_DIR/assets/"
cp "$ROOT_DIR/manifest.safari.json" "$OUT_DIR/manifest.json"

echo "Safari extension package prepared at: $OUT_DIR"
echo "Next: run safari-web-extension-converter on this folder."
