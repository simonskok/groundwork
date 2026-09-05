#!/usr/bin/env bash
# Groundwork - toolchain setup for a fresh session.
#
# Installs the one runtime dependency so `npm test` can run. Nothing else:
# this repo has no build, no bundler, no linter and no typecheck, and none
# is being added. Safe to run repeatedly - a second run is a no-op.
#
# Needs: Node >= 18 already present, and network access to the npm registry.

set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  echo "cloud_setup: node is not installed. Groundwork needs Node >= 18." >&2
  echo "cloud_setup: the environment did not provide a toolchain. Install Node, then re-run." >&2
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "cloud_setup: node $(node -v) is too old. Groundwork needs Node >= 18 (package.json engines)." >&2
  exit 1
fi
echo "cloud_setup: node $(node -v), npm $(npm -v)"

if [ -d node_modules ] && [ -d node_modules/@neondatabase/serverless ]; then
  echo "cloud_setup: dependencies already installed, nothing to do"
else
  if [ -f package-lock.json ]; then
    echo "cloud_setup: installing from the lockfile (npm ci)"
    npm ci --no-audit --no-fund
  else
    echo "cloud_setup: no lockfile, installing (npm install)"
    npm install --no-audit --no-fund
  fi
fi

echo "cloud_setup: ready. Gates: build none, tests 'npm test'."
