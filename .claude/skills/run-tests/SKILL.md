---
name: run-tests
description: How to run this repo's gates, what covers what, and how to read results. Use before and after any api/ change.
---

# Run tests

Work is committed straight to main and a push deploys production, so the gates run
locally, before the commit. That order is the whole safety model.

## Requirements

- Node 22 in cloud sessions (owner decision; `package.json` floor is >=18). Check with
  `node -v` first.
- `npm install` once per environment - the suites import `@neondatabase/serverless`.
- No database, no network, no keys needed for the default run.

## The gates

| Command | Covers |
|---|---|
| `npm test` | everything in `test/`: `node --test` (expected: 12 pass, 3 live tests skip) |
| `npm run sweep` | `index.html`'s engine: every answer combination, exits non-zero on a broken invariant |
| `node --test test/capture.test.js` | `api/capture.js` - method/validation guards |
| `node --test test/tailor.test.js` | `api/tailor.js` - provider pick, JSON extraction, HTTP guards |
| `npm run test:live` | optional: really calls the model API. Needs `RUN_LIVE=1` + a real key. Only when asked. |

While iterating, run only the suite covering the file you changed. The expected pass
count was last confirmed by a human on 2026-09-04; if your run disagrees, report the
difference rather than assuming the doc is right.

## What has no coverage (do not pretend otherwise)

- `api/share.js` has no tests.
- `npm test` covers no part of `index.html`. `npm run sweep` covers the engine region
  (registries, `decide()`, `recommend()`) between the `SWEEP-START`/`SWEEP-END` markers -
  outcomes, not rendering. Everything else in the file (the canvas, all DOM code, the
  spin-up panel, the share flow) has no automated coverage at all and is verified by
  opening the page and looking.

There is no lint, no typecheck, no build. Do not invent one, and do not report their
absence as a failure.

## Reading results

- The suites hand-roll `mockRes()` and call handlers directly; env is saved and
  restored per case. A test that fails after you hoisted an env read to module scope
  is the contract working - env must be read at call time.
- Live tests skip by design without `RUN_LIVE=1`; 3 skips in the default run are
  expected, not a problem.
