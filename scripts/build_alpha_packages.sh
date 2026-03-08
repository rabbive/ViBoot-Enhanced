#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${1:-$ROOT_DIR/releases/alpha}"
WORK_DIR="$(mktemp -d)"
CHROME_DIR="$WORK_DIR/chrome"
FIREFOX_DIR="$WORK_DIR/firefox"

mkdir -p "$DIST_DIR"
mkdir -p "$CHROME_DIR" "$FIREFOX_DIR"

copy_common_files() {
	local target_dir="$1"
	cp -R "$ROOT_DIR/assets" "$target_dir/assets"
	cp -R "$ROOT_DIR/html" "$target_dir/html"
	cp -R "$ROOT_DIR/js" "$target_dir/js"
	cp -R "$ROOT_DIR/service_worker" "$target_dir/service_worker"
}

copy_common_files "$CHROME_DIR"
copy_common_files "$FIREFOX_DIR"

cp "$ROOT_DIR/manifest.chrome.json" "$CHROME_DIR/manifest.json"
cp "$ROOT_DIR/manifest.json" "$FIREFOX_DIR/manifest.json"

(
	cd "$CHROME_DIR"
	zip -qr "$DIST_DIR/ViBoot-Enhanced-chrome-alpha.zip" .
)
(
	cd "$FIREFOX_DIR"
	zip -qr "$DIST_DIR/ViBoot-Enhanced-firefox-alpha.zip" .
)

rm -rf "$WORK_DIR"

echo "Built alpha packages:"
echo " - $DIST_DIR/ViBoot-Enhanced-chrome-alpha.zip"
echo " - $DIST_DIR/ViBoot-Enhanced-firefox-alpha.zip"
