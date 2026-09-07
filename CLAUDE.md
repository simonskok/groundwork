# CLAUDE.md - standing context for Groundwork

Read this fully before touching anything. Single source of truth for how to work here.
Domain terms are in [CONTEXT.md](CONTEXT.md). Use those terms exactly.

## What this repo is

Groundwork is a guided decision + guidance partner for non-technical and semi-technical
founders. They answer nine plain questions - their idea in their own words, then eight
choices; the submit gate is the eight, so a blank idea never blocks anyone - and
Groundwork recommends an opinionated, **honest** tech stack - sometimes "you don't need a
custom stack yet" - with reasoning for every pick, the options it beat, an honest cost, and a
step-by-step plan. The signature is a live canvas: a tangled knot of options around a "YOU"
node that untangles into one lit path as answers land. Feeling arc: **trapped -> free**.

It is a free public advisor. Founders judge it by whether the recommendation is honest and
whether they understand why. **Out of scope:** building their app for them, and provisioning
their cloud accounts behind their back.

Stack: static `index.html` (vanilla JS, no build, no framework, ES5-style `var`/`function`)
+ Vercel Node serverless functions in `api/` + Neon Postgres. One runtime dependency
(`@neondatabase/serverless`). Node >= 18. Google Fonts are the only external asset.

## Positioning and where it's going

The gap between developer discovery tools (StackShare), learning roadmaps (roadmap.sh),
black-box AI app builders (Lovable/Bolt/v0), and code-first boilerplates
(ShipFast/Supastarter). The wedge is plain-language, honest guidance for people who want to
understand what they're building. The authored reasoning in `TOOLS` is the moat - no public
resource does layered + goal-relative reasoning (the CNCF Landscape is the cautionary
example: the most complete catalogue there is, and looking at it is the exact feeling this
product removes). Curated, not exhaustive: 3-5 real options per stage.

Roadmap 1-4 are all DONE: shipped on Vercel; shareable results (`?p=` + `?r=`); AI tailoring
(needs `GEMINI_API_KEY`); one-click spin-up (deep links, generated `.env`, Deploy-to-Vercel).
Next candidates: server-side provisioning (needs a persistent server + OAuth token vault -
out of scope for static+functions), affiliate links on recommended tools, saved named stacks
per user (Neon Auth). Business model: free advisor for reach -> paid guidance/provisioning ->
affiliate revenue -> premium templates.

## How to work here (rules)

- Prefer editing an existing file over creating one. Ask before adding a file, with a reason.
- One source of truth per fact. Never invent; if unsure, ask or write UNKNOWN.
- Edit the smallest scope that solves the task. Don't refactor or rename unrelated code.
- Consult `docs/SYMBOL_INDEX.md` / `docs/MODULE_MAP.md` to locate a target instead of
  grepping the tree - but **re-verify the line number with `grep -n` before editing**.
- State the file path and function you are changing before you edit it.
- Don't run the full test suite unless asked; run only what covers the change
  (`node --test test/capture.test.js`). Frontend changes have no test coverage at all.
- **Deliver complete, runnable files, not patches.** End with something viewable.
- Plain hyphens, no em dashes, no maritime metaphors. Warm, plain language.

### Locked - these must never happen

1. **Never split `index.html`.** It is one file on purpose, so it opens straight in a browser
   with no build and no server. Its size is not a reason to break it up.
2. **Never re-derive a pick outside `decide()`.** `recommend()`, `graphTargets()`,
   `renderSpinKit()` and `openCompare()` all read from it. A second copy of a rule is the
   exact bug that once let the spin-up panel say "open Supabase" while the card above
   recommended Neon.
3. **Never modernise the frontend style.** `var`, `function(){}`, `.then()`, globals in one
   script block. No `let`/`const`, no arrow functions, no modules, no `async`/`await`, no
   framework. The only allowed exceptions are the two already there: `fetch` and
   `crypto.randomUUID()` (with a fallback).
4. **Never change the canvas seed.** `mulberry32(20260902)` makes the tangle identical on
   every load. It is the product's signature image, not a detail.

### Branching: there isn't any

`main` is the only branch and the single source of truth. Commit **directly to `main`** - do
not create a feature branch, a worktree, or a second copy of a file to "work on", and do not
ask whether to branch. One branch, one working tree, one version of every file. This is a
solo repo that auto-deploys, so a branch only splits attention and hides what is actually
current. Pushing is separate: it publishes to GitHub and triggers a Vercel **production**
deploy, so ask before `git push` unless told otherwise in the moment.

## Architecture and boundaries

Three parts, one direction of dependency:

1. **The frontend** (`index.html`) is the whole product. It runs standalone from `file://`.
   `profile(answers)` reads the eight answers, `decide(answers)` makes every pick,
   `recommend()` turns picks into cards and prose, `graphTargets()`/`draw()` drive the
   canvas, and `counterfactual()` re-runs `decide()` with each answer flipped.
2. **The API** (`api/*.js`) is three independent CommonJS handlers with no framework and no
   shared module. Each reads env at call time and returns 501 when its key is absent.
3. **The database** (`db/*.sql`) is two tables in Neon: `stacks` for short links, `sessions`
   for capture. Already applied; there is no migration system.

The frontend never depends on 2 or 3. Removing every env var leaves the full product.

**Do-not-touch:** the four locked items above, plus `db/schema.sql` (see the map) and
`package-lock.json` (regenerated by npm, never hand-edited).

## Repository map

```
index.html          The entire frontend. One file, ES5 style, no build. LOCKED: never split
api/tailor.js       AI layer - Gemini default / Groq fallback. 3 stages: followups/insights/brief
api/share.js        Short share links (?r=) - Neon-backed. GET resolves, POST creates
api/capture.js      Anonymous session capture (the data moat) + opt-in email. Two phases
db/schema.sql       public.stacks + public.sessions. DO-NOT-EDIT casually: already applied to
                    the live Neon DB. Editing it changes nothing in production - you must also
                    run the change in Neon Console -> SQL Editor. It is not a migration
db/insights.sql     The aggregate "map" queries - the sellable output
test/               node:test suites for tailor.js and capture.js. No network, no DB
docs/               Generated reference index. DO-NOT-TRUST the file:line tables without a
                    grep -n first - they were indexed against an older snapshot of index.html
package-lock.json   DO-NOT-EDIT. Regenerated by npm install
scripts/cloud_setup.sh  Toolchain install for a fresh cloud session. Safe to re-run
vercel.json         cleanUrls + security headers. Zero-config routing otherwise
CONTEXT.md          The domain glossary
ENVIRONMENT.md      What a session needs to run: network level and env vars
.claude/            Skills, commands, the review subagent, and permissions
```

## Conventions

- **Frontend:** vanilla JS, ES5 style, one global script block, compact formatting. Match the
  density of the surrounding lines. `$(sel)` is the only DOM helper. HTML is built as strings
  and everything interpolated passes through an escaper (`esc`, `escHtml`, `escAttr`).
- **Backend:** Node CommonJS, `module.exports = handler`, no framework, no imports beyond
  `@neondatabase/serverless` and Node's own `crypto`. Env is read **inside** a function so
  tests can swap it per case.
- **New code lives in the file that owns the concern.** A rule goes in `decide()`. A tool goes
  in `TOOLS`. A label goes in a lookup map, not an `if`. There is no place for a new module.
- **Format/lint command: none.** There is no formatter, no linter, no typecheck and no
  codegen in this repo, and none is being added. Match the surrounding style by hand.
- Full patterns and footguns: **[docs/CONVENTIONS.md](docs/CONVENTIONS.md)**.

## Gates (must pass before any change is done)

- **Build: none.** There is no build, bundler, minifier or compile step. Don't invent one.
- **Tests:** `npm install` once, then `npm test` (`node --test`). One file:
  `node --test test/capture.test.js`. Live model calls: `npm run test:live` (needs `RUN_LIVE=1`
  and a model key; POSIX shells only).
- **CI: none.** No `.github/`, no workflow, no pre-commit hook. `npm test` run by hand is the
  only automated check that exists, and it covers `api/capture.js` and `api/tailor.js` only -
  **no frontend code is tested at all.**

A change is not done until every gate that exists is green.

## Definition of done

1. `npm test` green.
2. Docs updated in the same commit - CLAUDE.md, README.md, HANDOFF.md, `docs/` and
   `CONTEXT.md` as applicable. This includes raising the capture cap in the same commit that
   adds a card.
3. `index.html` opened in a browser and the changed path exercised by hand, because there is
   no frontend test coverage and no build step to catch a syntax error.

## How to run

```bash
npm install          # once - tests import @neondatabase/serverless
npm test             # node --test - 12 pass, 3 LIVE tests skip
npm run test:live    # RUN_LIVE=1 + a model key; POSIX shells only (env-prefix syntax)
```

- **View the frontend:** open `index.html` in a browser. No build, no server needed;
  `/api/*` calls fail and the site degrades to the deterministic advisor by design.
- **Full local run incl. `/api`:** `vercel dev` (serves at :3000). UNVERIFIED - needs the
  Vercel CLI installed; not a package.json script.
- **Sweep the engine headlessly** after any `decide()`/`recommend()` change - see the recipe
  in `docs/CONVENTIONS.md` (Testing). Current: 2592 combinations, mean 17.7 cards, max 24.
- **No lint, typecheck, or build step exists.** Don't invent one.

## Credentials - where they actually are

**There are no credentials in this repo and there never will be.** `.env.example` is the
only env file committed; it lists variable *names* with blank values as documentation.
Every real value lives in **one** place:

> **Vercel -> the `groundwork` project -> Settings -> Environment Variables.**

That is the single store. The functions read them at **call time** from `process.env`
(`api/tailor.js:14`/`:15`, `api/share.js:14`, `api/capture.js:24`), server-side only - no key
is ever sent to the browser, and nothing is bundled at build time because there is no build.

| Variable | Unlocks | Where the value comes from |
|---|---|---|
| `DATABASE_URL` | `/api/share`, `/api/capture` (Neon) | **Set automatically** by the Vercel-Neon integration (Vercel -> Storage). You never paste it. To read it by hand: Neon Console -> Connection Details |
| `GEMINI_API_KEY` | `/api/tailor` (default provider) | https://aistudio.google.com/app/apikey - free tier, no card, starts `AIza...` |
| `GROQ_API_KEY` | `/api/tailor` (fallback provider) | https://console.groq.com/keys - starts `gsk_...` |
| `AI_PROVIDER` | forces `"gemini"` or `"groq"` when both keys exist | optional |
| `TAILOR_MODEL` | model override | optional |

Also accepted for the DB, in this order: `DATABASE_URL`, `POSTGRES_URL`,
`DATABASE_URL_UNPOOLED`, `POSTGRES_URL_NON_POOLING`.

**Getting them onto your machine** (only needed for `vercel dev`; opening `index.html`
directly needs nothing):

```bash
vercel env pull .env.local    # writes the real values locally - gitignored, never commit it
```

**With none of them set the site is the full deterministic advisor.** Every `/api` route
returns 501 and the frontend hides the feature silently. That is the designed state, not a
broken one - so a missing key is never the cause of a broken stack recommendation.

If a Neon MCP connection is attached to a session it is typically **read-only** and will not
hand out a connection string; take `DATABASE_URL` from the Vercel or Neon dashboard instead.

Full environment and network detail: **[ENVIRONMENT.md](ENVIRONMENT.md)**.

## Pointers

Full component/deps view -> **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**. Module graph
with `file:line` -> **[docs/MODULE_MAP.md](docs/MODULE_MAP.md)**. Symbol lookup table ->
**[docs/SYMBOL_INDEX.md](docs/SYMBOL_INDEX.md)**. Entry points and traced flows ->
**[docs/DATA_FLOW.md](docs/DATA_FLOW.md)**. Patterns, testing, footguns ->
**[docs/CONVENTIONS.md](docs/CONVENTIONS.md)**.

All five were indexed 2026-09-04 against `index.html` @ 2024 lines, md5 `33c3da71...`
(commit `3a1f721`). **`index.html` has changed since: it is now 2431 lines, md5
`9be09861...`.** The structure, the registries and the reasoning in those docs still hold;
every `file:line` in them is approximate. Always `grep -n` first.

## Domain language

See **[CONTEXT.md](CONTEXT.md)**. Use those terms exactly.

## Non-negotiables (design reasoning - don't relitigate)

- **Honesty is the product.** The advisor must sometimes recommend LESS (no-code for a
  simple site; "Nothing. Go and ask them." for internal-tool analytics). Never upsell.
- **Reasoning over answers.** Every pick shows the options it beat and why, generated from
  `TOOLS`/`COMPETES` against the founder's stated goal - never hand-written per branch.
- **`decide()` is the single source of truth.** See locked rule 2.
- **The tangle conveys feeling; the cards carry the legible detail.** The canvas is
  deliberately not the reading surface on mobile.
- **Plain, human language.** Jargon only behind a click, never in plain sight.
- **AI + database features are additive and degrade cleanly.** With zero env vars the site
  is the full deterministic advisor. Every `/api` call must survive 404/501 silently.
- **Never export `sessions.email` or `sessions.idea`** into anything published or sold. The
  aggregate is built from `answers` + `stack` only. That constraint is the brand.
- **Visual identity.** Cool (`--cool`) = infrastructure, set once and forget. Warm amber
  (`--warm`) = the value layer, where effort goes. Fraunces (hero + verdict headings),
  Archivo (display), IBM Plex Sans (body), IBM Plex Mono (eyebrows/data/commands). Full
  light + dark themes, both defined explicitly.

## What has broken before

- **Three copies of the pick rules.** The spin-up panel told founders to open Supabase while
  the card above recommended Neon. Fixed by making everything read `decide()`. This is why
  locked rule 2 exists.
- **Hardcoded counts going stale.** The figure caption used to be a literal ("34 options
  across 13 decisions") and drifted out of date as stages were added. `updateCaption()` now
  derives it from `NODES.length` / `STAGES.length`. Don't reintroduce a literal - a stale
  count in a product that promises an honest number is the same broken promise as a stale
  price. (`docs/CONVENTIONS.md` gotcha 13 still described the old, broken state; it has been
  corrected.)
- **The test script itself was broken.** `npm test` ran `node --test test/`, and passing a
  directory that way fails on Node 22 with `Cannot find module .../test` - zero tests run,
  exit 1, while the docs said 12 pass. It is now bare `node --test`, which finds the same
  files on every supported Node version. If a gate is documented, run it before trusting it.
- **Reference docs going stale within days.** `docs/` was indexed at 2024 lines and
  `index.html` was 2431 five commits later. Line numbers in `docs/` are approximate by
  default now.

## Known pitfalls

- **`index.html` line numbers drift constantly** - one file under active edit, 2431 lines,
  md5 `9be09861...` as last checked. Always `grep -n` to confirm a location before editing.
- **`needs` in `decide()` is the TRIGGER, not the full dependency set.** A stage settles on
  the canvas when the answer that makes it *meaningful* arrives, and the pick keeps
  sharpening after. Gate on full dependencies instead and nothing moves until the last
  question - accurate, and it feels like nothing happened.
- **Not every stage belongs on the canvas.** `STAGES` (16) drives the tangle; `COMPETES` (26)
  is the full decision set and `decide()` makes 24 picks. The canvas only labels *chosen*
  nodes, so more tentacles crowd it without adding feeling - the newer founder-facing
  decisions (cms, glue, support, marketing, forms, legal, uptime, backup) are cards only,
  exactly like `site` and `platform`.
- **"Start here" has to mean the minimum that gets you live.** With 26 stages it is easy to
  badge everything `core` and end up with 15 "Start here" cards, which is the upsell the
  product exists to refuse. Results carry a `now / later` split for exactly this reason;
  the sweep currently gives mean 12.0 "now", max 16. If the mean creeps past ~12, demote
  something.
- **The capture cap has zero headroom.** `cleanStack` truncates at 24 entries
  (`api/capture.js:63`) and the verified maximum result is exactly 24 cards. The next
  `mod()` you add silently drops data from the moat - raise the cap in the same commit.
- **`TOOLS` entries carry a `checked` date (`CHECKED`, currently `"2026-09"`).** A stale
  price in a product that promises an honest cost is a broken promise. Re-check anything
  older than ~6 months. Costs are shapes, not exact cents.
- **A card standing for several tools must pass an array** to `mod()` (e.g.
  `["framer","webflow"]`), or it lists itself among the options it beat.
- **Adding a card means adding its `role` string to `ROLE2STAGE`**, or it silently falls
  into the `build` layer and gets no counterfactual.
- **Adding a tool = one entry in `TOOLS` + its id in `COMPETES`.** It then appears wherever
  it competes, automatically, in the compare table and the "options it beat" list. Use the
  `add-a-tool` skill.
- **The figure-caption counts are derived, never typed.** `updateCaption()` reads
  `NODES.length` / `STAGES.length`, so adding a tool or a canvas stage updates the caption
  by itself.
- **The `api/*` handlers are CommonJS** (`module.exports = handler`) with no framework.
  They read env **at call time**, not import time, so tests can set it dynamically.
- **`VALID` (the 8 answers whitelist) is duplicated in `api/share.js` and `api/capture.js`.**
  If you add a question or an option value, update the frontend `CODE` map AND both copies,
  or shared links and capture start rejecting valid answers with 400.
- **`db/schema.sql` is already applied to the live Neon DB.** It's the source of truth for
  re-creation, not a migration system - there are no migrations.
