#!/usr/bin/env bash
# SessionStart hook: make a fresh web session immediately workable.
# Idempotent and quiet — only acts when something is actually missing.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

# Install node deps only if they are absent (a clone has no node_modules).
if [ ! -d node_modules ]; then
  echo "[ensure-deps] node_modules missing — running npm install..."
  npm install --no-audit --no-fund >/dev/null 2>&1 \
    && echo "[ensure-deps] dependencies installed." \
    || echo "[ensure-deps] npm install failed — run it manually."
fi

# Surface missing local env without leaking secrets.
if [ ! -f .env ]; then
  echo "[ensure-deps] no .env found — copy .env.example to .env before 'npm run dev'."
fi

exit 0
