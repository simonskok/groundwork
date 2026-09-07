# ENVIRONMENT.md - what a session needs

## Toolchain

- **Node 22** (owner decision 2026-09-07; `package.json` requires only >=18, but 22 is
  what Vercel runs and what the sibling repos use). One-time step in the claude.ai/code
  environment selector: pick a Node 22 base. The SessionStart hook verifies the version
  and says so; it does not silently switch it.
- Dependencies: `npm install` (one dependency, `@neondatabase/serverless`; the tests
  import it, so install before testing). There is no lockfile-strict `npm ci`
  requirement, but `npm ci` also works - `package-lock.json` is committed.
- **No build step, no lint, no typecheck exist. Do not invent one.**

## Network

- `registry.npmjs.org` - `npm install`. The default Trusted level covers it.
- Nothing else is needed for the default gates: `npm test` makes no network calls and
  needs no database.
- `npm run test:live` calls the real model APIs (`generativelanguage.googleapis.com` for
  Gemini, `api.groq.com` for Groq) and needs a real key in the environment. It is
  optional and off by default; do not run it unless asked.

## Environment variables

None required for development or tests. The app with zero env vars is the full
deterministic advisor by design - a missing key is never the cause of a broken
recommendation.

The real values live in exactly one place: Vercel, project `groundwork`, Settings,
Environment Variables (see CLAUDE.md "Credentials"). Never print, commit, or copy them
into the repo. `.env.example` documents the names with blank values:
`GEMINI_API_KEY` / `GROQ_API_KEY` (AI layer), `AI_PROVIDER`, `TAILOR_MODEL` (optional),
`DATABASE_URL` (Neon, set automatically by the Vercel integration).

If a Neon MCP connection is attached to a session it is typically read-only and will
not hand out a connection string; that is expected, not a failure.

## Known snags

- A selected environment sometimes does not apply to a new session. Do not trust the
  selector: first act of a session is `node -v` (expect v22) and `npm test` (expect
  12 pass, 3 skips). Fix the environment before trusting anything else.
- `npm run test:live` uses POSIX env-prefix syntax and fails on PowerShell; in cloud
  sessions (Linux) this does not bite.
- `vercel dev` is the only way to exercise `/api` locally and the Vercel CLI is not
  installed by default and not a package.json script. Opening `index.html` without it is
  the normal workflow: the API calls fail and the site degrades exactly as designed.

## What is automatic vs one-time

- Automatic, committed: the SessionStart hook in `.claude/settings.json` runs
  `scripts/cloud_setup.sh` (version check + `npm install`) on every session start.
- One-time, manual: choosing the Node 22 base in the claude.ai/code environment
  selector. The default Trusted network level is enough.
