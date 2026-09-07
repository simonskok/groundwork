#!/usr/bin/env bash
# Session setup for groundwork: Node version check + npm install.
# Safe to run repeatedly; each step checks before acting. Verifies, does not
# silently fix - a wrong toolchain should be visible, not papered over.
set -uo pipefail
cd "$(dirname "$0")/.."

echo "[setup] node: $(node -v 2>/dev/null || echo 'not found')"

# 1. Node version. package.json requires >=18; the chosen base is Node 22.
MAJOR=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')
if [ "${MAJOR:-0}" -lt 18 ]; then
  echo "[setup] WARNING: Node is ${MAJOR:-unknown}; package.json requires >=18."
  echo "[setup] Pick a Node 22 base image in the environment selector (ENVIRONMENT.md)."
elif [ "${MAJOR:-0}" -lt 22 ]; then
  echo "[setup] NOTE: Node ${MAJOR} satisfies >=18 but the chosen base is 22. Tests"
  echo "[setup] should still pass; say so in your report rather than hiding it."
fi

# 2. Dependencies (one runtime dep; the tests import it).
if [ ! -d node_modules/@neondatabase/serverless ]; then
  echo "[setup] npm install"
  npm install || echo "[setup] WARNING: npm install failed; check network (ENVIRONMENT.md)"
else
  echo "[setup] dependencies present, skipping npm install"
fi

echo "[setup] done. Verify: node -v (expect v22), npm test (expect 12 pass, 3 skips)."
