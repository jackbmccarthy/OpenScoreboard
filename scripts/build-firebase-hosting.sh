#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${FIREBASE_BUILD_DIR:-"$ROOT_DIR/firebase-build"}"

copy_dist() {
  local source_dir="$1"
  local target_dir="$2"

  if [[ ! -d "$source_dir" ]]; then
    echo "Missing build output: $source_dir" >&2
    exit 1
  fi

  mkdir -p "$target_dir"
  cp -R "$source_dir/." "$target_dir/"
}

if [[ -z "$OUTPUT_DIR" || "$OUTPUT_DIR" == "/" ]]; then
  echo "Refusing to use unsafe Firebase build directory: $OUTPUT_DIR" >&2
  exit 1
fi

echo "Building production bundles..."
(cd "$ROOT_DIR" && npm run build:prod)

echo "Creating Firebase Hosting bundle at $OUTPUT_DIR..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

copy_dist "$ROOT_DIR/openscoreboard-app/dist" "$OUTPUT_DIR/app"
copy_dist "$ROOT_DIR/openscoreboard-editor/dist" "$OUTPUT_DIR/editor"
copy_dist "$ROOT_DIR/openscoreboard-scoreboard/dist" "$OUTPUT_DIR/scoreboard"
copy_dist "$ROOT_DIR/openscoreboard-scoreboard/dist-brackets" "$OUTPUT_DIR/brackets"

cat > "$OUTPUT_DIR/index.html" <<'HTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=/app/">
    <title>Open Scoreboard</title>
  </head>
  <body>
    <a href="/app/">Open Scoreboard</a>
  </body>
</html>
HTML

echo "Firebase Hosting bundle ready: $OUTPUT_DIR"
