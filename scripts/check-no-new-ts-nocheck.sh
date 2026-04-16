#!/usr/bin/env bash
set -euo pipefail

BASELINE_FILE="${1:-.github/ts-nocheck-baseline.txt}"

if [ ! -f "$BASELINE_FILE" ]; then
  echo "Baseline file $BASELINE_FILE not found."
  exit 1
fi

BASELINE_COUNT="$(tr -d '[:space:]' < "$BASELINE_FILE")"
if ! [[ "$BASELINE_COUNT" =~ ^[0-9]+$ ]]; then
  echo "Baseline file $BASELINE_FILE must contain a single numeric count."
  exit 1
fi

CURRENT_COUNT="$( (rg -n '@ts-nocheck' src app || true) | wc -l | tr -d '[:space:]' )"

if [ "$CURRENT_COUNT" -gt "$BASELINE_COUNT" ]; then
  echo "@ts-nocheck count regressed: current=$CURRENT_COUNT baseline=$BASELINE_COUNT"
  exit 1
fi

echo "@ts-nocheck count OK: current=$CURRENT_COUNT baseline=$BASELINE_COUNT"
