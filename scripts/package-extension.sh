#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v zip >/dev/null 2>&1; then
  echo "Error: 'zip' command not found. Please install zip first (e.g. sudo apt install zip)." >&2
  exit 1
fi

DIST_DIR="$ROOT_DIR/dist"
STAGE_DIR="$DIST_DIR/stage"
VERSION="$(node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('manifest.json','utf8'));process.stdout.write(m.version)")"
PACKAGE_NAME="$(node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));process.stdout.write(p.name)")"
ZIP_FILE="${PACKAGE_NAME}-v${VERSION}.zip"

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR" "$DIST_DIR"

cp manifest.json "$STAGE_DIR/"
cp background.js popup.html popup.css popup.js "$STAGE_DIR/"
cp -R icons "$STAGE_DIR/"
cp -R src "$STAGE_DIR/"

if [ -d "_locales" ]; then
  cp -R _locales "$STAGE_DIR/"
fi

(
  cd "$STAGE_DIR"
  zip -r -q "../$ZIP_FILE" .
)

rm -rf "$STAGE_DIR"
echo "Created package: $DIST_DIR/$ZIP_FILE"
