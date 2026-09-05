# ENVIRONMENT.md - what a session needs to run

Short version: **the default is nearly enough.** One dependency install, no build, and no
secrets. Everything below is the detail behind that.

## Network level

| Needs network | For what |
|---|---|
| **Yes, once per session** | `npm ci` fetching `@neondatabase/serverless` and its 13 transitive packages from the npm registry. This is the only thing that must reach the internet. |
| **No** | `npm test`. The suite calls the handlers directly with a hand-rolled mock response object. No server, no database, no model API. |
| **No** | Editing anything. There is no build, no bundler, no linter and no typecheck. |
| **Only if you ask for it** | `npm run test:live`, which calls the real Gemini or Groq API and needs `RUN_LIVE=1` plus a model key. Three tests, skipped by default. |
| **Browser only** | Google Fonts, fetched by `index.html` at page load. If it is blocked the page still works; it falls back to system fonts. |

So: **a network level that allows the npm registry is enough.** Nothing in this repo needs
access to Vercel, Neon, Google or Groq to build or to pass its tests. Deployment happens on
Vercel from a push to GitHub, never from inside a session.

## Environment variables

**None are required.** With every one of them unset, the site is the full deterministic
advisor: each `/api` route returns 501 and the frontend hides that feature silently. That is
the designed state, not a broken one.

| Variable | Needed for | Why | Where the value comes from |
|---|---|---|---|
| `DATABASE_URL` | `/api/share`, `/api/capture` | Neon Postgres holds the `stacks` table (short `?r=` links) and the `sessions` table (anonymous capture). Without it, short links fall back to long `?p=` links and the "Get the map" card hides itself. | Set automatically by the Vercel-Neon integration. You never paste it. |
| `GEMINI_API_KEY` | `/api/tailor` | The default AI provider, for follow-up questions, the idea-specific read, and the build brief. | https://aistudio.google.com/app/apikey - free tier, no card. |
| `GROQ_API_KEY` | `/api/tailor` | The alternative AI provider. Either key is enough; Gemini wins if both are set. | https://console.groq.com/keys |
| `AI_PROVIDER` | optional | Forces `"gemini"` or `"groq"` when both keys exist. | you |
| `TAILOR_MODEL` | optional | Model override. | you |
| `RUN_LIVE` | optional, tests only | Set to `1` to un-skip the three tests that call a real model API. | you |

Also accepted for the database, in this order: `DATABASE_URL`, `POSTGRES_URL`,
`DATABASE_URL_UNPOOLED`, `POSTGRES_URL_NON_POOLING`.

**The real values live in exactly one place: Vercel -> the `groundwork` project -> Settings ->
Environment Variables.** Nothing is committed here. `.env.example` lists the names with blank
values as documentation and nothing else. The functions read `process.env` at call time,
server-side, so no key ever reaches the browser and nothing is baked in at build time -
there is no build.

To pull the real values onto a machine for `vercel dev`: `vercel env pull .env.local`. That
file is gitignored. Never commit it.

## What is automatic, and the one thing you do by hand

**Automatic.** `scripts/cloud_setup.sh` runs as a SessionStart hook (wired in
`.claude/settings.json`). It checks Node is present and at least 18, then installs from the
lockfile with `npm ci`. It is safe to re-run: a second run sees `node_modules` and does
nothing. It installs the toolchain and stops there, because there is nothing to build.

**Your one-time step.** In claude.ai/code, pick an environment for this repo in the
environment selector, with a network level that allows the npm registry. That is it.

**The warning that matters.** A selected environment does not always actually apply. Do not
trust the selector - the first session in a new environment should confirm the toolchain is
really there before assuming it:

```bash
node -v            # must be >= 18
bash scripts/cloud_setup.sh
npm test
```

If Node is missing, `cloud_setup.sh` says so and exits rather than pretending. If the npm
registry is unreachable, `npm ci` fails loudly. Either way you know within seconds, instead
of discovering it halfway through a change.
