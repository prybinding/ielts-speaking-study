#!/usr/bin/env bash
set -euo pipefail
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"
node scripts/generate-next-day.mjs

git add -A
if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

day=$(node -p "require('./data/state.json').lastDay")

git commit -m "docs: add day ${day}" || true
if git remote get-url origin >/dev/null 2>&1; then
  git push || true
else
  echo "No git remote 'origin' set; committed locally only."
fi
