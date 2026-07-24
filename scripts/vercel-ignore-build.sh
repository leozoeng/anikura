#!/usr/bin/env bash
# Vercel Ignored Build Step: exit 0 = skip build, exit 1 = continue.
# Skip previews and commits that don't touch the Next.js app surface.
set -euo pipefail

if [ "${VERCEL_ENV:-}" = "preview" ]; then
  echo "vercel-ignore-build: skipping preview deployment"
  exit 0
fi

# Only rebuild when app runtime / deps / config change.
# Catalog JSON syncs alone go through Supabase catalog_live — no deploy needed.
if git diff --quiet HEAD^ HEAD -- \
  src \
  public \
  package.json \
  package-lock.json \
  next.config.ts \
  next.config.mjs \
  next.config.js \
  tsconfig.json \
  postcss.config.mjs \
  postcss.config.js \
  eslint.config.mjs \
  eslint.config.js \
  vercel.json \
  scripts/vercel-ignore-build.sh
then
  echo "vercel-ignore-build: no app-relevant changes — skipping"
  exit 0
fi

echo "vercel-ignore-build: app changes detected — building"
exit 1
