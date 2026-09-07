# CLAUDE.md — standing context for Groundwork

## What this is

Groundwork is a guided decision + guidance partner for non-technical and semi-technical
founders. They answer nine plain questions — their idea in their own words, then eight
choices; the submit gate is the eight, so a blank idea never blocks anyone — and
Groundwork recommends an opinionated, **honest** tech stack — sometimes "you don't need a
custom stack yet" — with reasoning for every pick, the options it beat, an honest cost, and a
step-by-step plan. The signature is a live canvas: a tangled knot of options around a "YOU"
node that untangles into one lit path as answers land. Feeling arc: **trapped → free**.

Stack: static `index.html` (vanilla JS, no build, no framework, ES5-style `var`/`function`)
+ Vercel Node serverless functions in `api/` + Neon Postgres. One runtime dependency
(`@neondatabase/serverless`). Node >= 18. Google Fonts are the only external asset.

## Positioning and where it's going

The gap between developer discovery tools (StackShare), learning roadmaps (roadmap.sh),
black-box AI app builders (Lovable/Bolt/v0), and code-first boilerplates
(ShipFast/Supastarter). The wedge is plain-language, honest guidance for people who want to
understand what they're building. The authored reasoning in `TOOLS` is the moat — no public
resource does layered + goal-relative reasoning (the CNCF Landscape is the cautionary
example: the most complete catalogue there is, and looking at it is the exact feeling this
product removes). Curated, not exhaustive: 3–5 real options per stage.

Roadmap 1–4 are all DONE: shipped on Vercel; shareable results (`?p=` + `?r=`); AI tailoring
(needs `GEMINI_API_KEY`); one-click spin-up (deep links, generated `.env`, Deploy-to-Vercel).
Next candidates: server-side provisioning (needs a persistent server + OAuth token vault —
out of scope for static+functions), affiliate links on recommended tools, saved named stacks
per user (Neon Auth). Business model: free advisor for reach → paid guidance/provisioning →
affiliate revenue → premium templates.

## How to run

```bash
npm install          # once - tests import @neondatabase/serverless
npm test             # node --test test/ - 12 pass, 3 LIVE tests skip. VERIFIED 2026-09-07.
npm run sweep        # the headless engine sweep - the only check covering index.html
npm run test:live    # RUN_LIVE=1 + a model key; POSIX shells only (env-prefix syntax)
```

- **View the frontend:** open `index.html` in a browser. No build, no server needed;
  `/api/*` calls fail and the site degrades to the deterministic advisor by design.
- **Full local run incl. `/api`:** `vercel dev` (serves at :3000). UNVERIFIED — needs the
  Vercel CLI installed; not a package.json script.
- **Sweep the engine headlessly** after any change to `decide()`, `recommend()`, `TOOLS`,
  `COMPETES`, `ROLE2STAGE` or `LAYER_OF`: `npm run sweep`. It reads the DOM-free region of
  `index.html` between the `SWEEP-START`/`SWEEP-END` markers, runs every legal answer
  combination with no browser, and exits non-zero on a broken invariant. Verified
  2026-09-07: 2592 combinations, mean 17.70 cards, min 8, max 24, mean 11.97 "now", max 16.
- **No lint, typecheck, or build step exists.** Don't invent one.

## Credentials — where they actually are

**There are no credentials in this repo and there never will be.** `.env.example` is the
only env file committed; it lists variable *names* with blank values as documentation.
Every real value lives in **one** place:

> **Vercel → the `groundwork` project → Settings → Environment Variables.**

That is the single store. The functions read them at **call time** from `process.env`
(`api/tailor.js:14`/`:15`, `api/share.js:14`, `api/capture.js:24`), server-side only — no key
is ever sent to the browser, and nothing is bundled at build time because there is no build.

| Variable | Unlocks | Where the value comes from |
|---|---|---|
| `DATABASE_URL` | `/api/share`, `/api/capture` (Neon) | **Set automatically** by the Vercel↔Neon integration (Vercel → Storage). You never paste it. To read it by hand: Neon Console → Connection Details |
| `GEMINI_API_KEY` | `/api/tailor` (default provider) | https://aistudio.google.com/app/apikey — free tier, no card, starts `AIza…` |
| `GROQ_API_KEY` | `/api/tailor` (fallback provider) | https://console.groq.com/keys — starts `gsk_…` |
| `AI_PROVIDER` | forces `"gemini"` or `"groq"` when both keys exist | optional |
| `TAILOR_MODEL` | model override | optional |

Also accepted for the DB, in this order: `DATABASE_URL`, `POSTGRES_URL`,
`DATABASE_URL_UNPOOLED`, `POSTGRES_URL_NON_POOLING`.

**Getting them onto your machine** (only needed for `vercel dev`; opening `index.html`
directly needs nothing):

```bash
vercel env pull .env.local    # writes the real values locally — gitignored, never commit it
```

**With none of them set the site is the full deterministic advisor.** Every `/api` route
returns 501 and the frontend hides the feature silently. That is the designed state, not a
broken one — so a missing key is never the cause of a broken stack recommendation.

If a Neon MCP connection is attached to a session it is typically **read-only** and will not
hand out a connection string; take `DATABASE_URL` from the Vercel or Neon dashboard instead.

## Where things live

```
index.html          The entire frontend: CSS 13-345, HTML 346-455, JS 456-2436.
                    SWEEP-START 457 / SWEEP-END 1481 bracket the DOM-free engine
api/tailor.js       AI layer — Gemini default / Groq fallback. 3 stages: followups/insights/brief
api/share.js        Short share links (?r=) — Neon-backed. GET resolves, POST creates
api/capture.js      Anonymous session capture (the data moat) + opt-in email. Two phases
db/schema.sql       public.stacks + public.sessions. Already applied to Neon
db/insights.sql     The aggregate "map" queries — the sellable output
test/               node:test suites for tailor.js and capture.js. No network, no DB
scripts/sweep.js    The headless engine sweep (`npm run sweep`). Gates index.html
scripts/cloud_setup.sh  SessionStart hook: git author, Node check, npm install
docs/               The generated reference index (below). Re-generate after big changes
vercel.json         cleanUrls + security headers. Zero-config routing otherwise
```

## Pointers

Full component/deps view → **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**. Module graph
with `file:line` → **[docs/MODULE_MAP.md](docs/MODULE_MAP.md)**. Symbol lookup table →
**[docs/SYMBOL_INDEX.md](docs/SYMBOL_INDEX.md)**. Entry points and traced flows →
**[docs/DATA_FLOW.md](docs/DATA_FLOW.md)**. Patterns, testing, footguns →
**[docs/CONVENTIONS.md](docs/CONVENTIONS.md)**.

All five were re-indexed 2026-09-04 against `index.html` @ 2024 lines, md5 `33c3da71…`
(commit `3a1f721`), including the 8 new stages, 2 new layers and 28 new tools.

**The index is currently STALE.** `index.html` is now 2436 lines (md5 `148c6de4…`,
measured 2026-09-07), so every `index.html` line number in the five docs (and some in this
file's own history) is off. Structure, symbol names and rationale are still right;
positions are not. Treat the docs as a map of what exists, `grep -n` as the only source
of where it is, and re-generate the index at the next big `index.html` change. One known
content fix since indexing: the figure-caption counts are no longer hardcoded
(CONVENTIONS.md footgun 13) - `updateCaption()` now derives them, as the pitfall list
below says.

## Working agreement

- Edit the smallest scope that solves the task. Don't refactor or rename unrelated code.
- Consult `docs/SYMBOL_INDEX.md` / `docs/MODULE_MAP.md` to locate a target instead of
  grepping the tree — but **re-verify the line number with `grep -n` before editing**.
- State the file path and function you are changing before you edit it.
- Don't run the full test suite unless asked; run only what covers the change
  (`node --test test/capture.test.js`). Frontend changes have no test coverage at all.
- **Deliver complete, runnable files, not patches.** End with something viewable.

### Branching: there isn't any

`main` is the only branch and the single source of truth. Commit **directly to `main`** — do
not create a feature branch, a worktree, or a second copy of a file to "work on", and do not
ask whether to branch. One branch, one working tree, one version of every file. This is a
solo repo that auto-deploys, so a branch only splits attention and hides what is actually
current. Pushing is separate: it publishes to GitHub and triggers a Vercel **production**
deploy, so ask before `git push` unless told otherwise in the moment.

## Non-negotiables (design reasoning — don't relitigate)

- **Honesty is the product.** The advisor must sometimes recommend LESS (no-code for a
  simple site; "Nothing. Go and ask them." for internal-tool analytics). Never upsell.
- **Reasoning over answers.** Every pick shows the options it beat and why, generated from
  `TOOLS`/`COMPETES` against the founder's stated goal — never hand-written per branch.
- **`decide()` is the single source of truth.** `recommend()`, `graphTargets()`,
  `renderSpinKit()` and `openCompare()` all read from it. Never re-implement a pick
  elsewhere — three copies of these rules is the exact bug that let the spin-up panel say
  "open Supabase" while the card above recommended Neon.
- **The tangle conveys feeling; the cards carry the legible detail.** The canvas is
  deliberately not the reading surface on mobile.
- **Plain, human language.** Jargon only behind a click, never in plain sight.
- **AI + database features are additive and degrade cleanly.** With zero env vars the site
  is the full deterministic advisor. Every `/api` call must survive 404/501 silently.
- **Visual identity.** Cool (`--cool`) = infrastructure, set once and forget. Warm amber
  (`--warm`) = the value layer, where effort goes. Fraunces (hero + verdict headings),
  Archivo (display), IBM Plex Sans (body), IBM Plex Mono (eyebrows/data/commands). Full
  light + dark themes, both defined explicitly.

## Known pitfalls

- **`index.html` line numbers drift constantly** - one file under active edit: 2024 lines
  when the docs were indexed, 2436 now. Every line number in `docs/` is wrong by roughly
  100-400 lines. Always `grep -n` to confirm a location before editing. This is also why
  `scripts/sweep.js` reads marker comments and not line offsets: the previous recipe
  sliced `sed -n '356,1369p'` and had been silently failing with a SyntaxError.
- **`needs` in `decide()` is the TRIGGER, not the full dependency set.** A stage settles on
  the canvas when the answer that makes it *meaningful* arrives, and the pick keeps
  sharpening after. Gate on full dependencies instead and nothing moves until the last
  question — accurate, and it feels like nothing happened.
- **Not every stage belongs on the canvas.** `STAGES` (16) drives the tangle; `COMPETES` (26)
  is the full decision set and `decide()` makes 24 picks. The canvas only labels *chosen*
  nodes, so more tentacles crowd it without adding feeling — the newer founder-facing
  decisions (cms, glue, support, marketing, forms, legal, uptime, backup) are cards only,
  exactly like `site` and `platform`.
- **"Start here" has to mean the minimum that gets you live.** With 26 stages it is easy to
  badge everything `core` and end up with 15 "Start here" cards, which is the upsell the
  product exists to refuse. Results carry a `now / later` split for exactly this reason;
  the sweep currently gives mean 12.0 "now", max 16. If the mean creeps past ~12, demote
  something.
- **The capture cap has zero headroom.** `cleanStack` truncates at 24 entries
  (`api/capture.js:63`) and the verified maximum result is exactly 24 cards. The next
  `mod()` you add silently drops data from the moat — raise the cap in the same commit.
- **`TOOLS` entries carry a `checked` date (`CHECKED`, currently `"2026-09"`).** A stale
  price in a product that promises an honest cost is a broken promise. Re-check anything
  older than ~6 months. Costs are shapes, not exact cents.
- **A card standing for several tools must pass an array** to `mod()` (e.g.
  `["framer","webflow"]`), or it lists itself among the options it beat.
- **Adding a card means adding its `role` string to `ROLE2STAGE`**, or it silently falls
  into the `build` layer and gets no counterfactual.
- **Adding a tool = one entry in `TOOLS` + its id in `COMPETES`.** It then appears wherever
  it competes, automatically, in the compare table and the "options it beat" list.
- **The figure-caption counts are derived, never typed.** `updateCaption()` reads
  `NODES.length` / `STAGES.length`, so adding a tool or a canvas stage updates the caption
  by itself. Don't reintroduce a literal there — a stale count in a product that promises an
  honest number is the same broken promise as a stale price.
- **Nothing may be lit before the first answer.** `repo` and `errors` have empty `needs`, so
  they would settle on a virgin page; `graphTargets()` returns early at zero answers to keep
  the landing state a whole undecided bundle. That opening *is* the "trapped" half of the arc.
- **The `api/*` handlers are CommonJS** (`module.exports = handler`) with no framework.
  They read env **at call time**, not import time, so tests can set it dynamically.
- **`VALID` (the 8 answers whitelist) is duplicated in `api/share.js` and `api/capture.js`.**
  If you add a question or an option value, update the frontend `CODE` map AND both copies,
  or shared links and capture start rejecting valid answers with 400.
- **Never export `sessions.email` or `sessions.idea`** into anything published or sold. The
  aggregate is built from `answers` + `stack` only. That constraint is the brand.
- **`db/schema.sql` is already applied to the live Neon DB.** It's the source of truth for
  re-creation, not a migration system — there are no migrations.

## Frozen contracts (owner decision, 2026-09-07)

These change only on Simon's explicit instruction, and the change edits the contract's
source file in the same commit. If a task seems to need one changed, stop and ask.

1. **`db/schema.sql`** - the live Neon schema. Editing the file alone changes nothing in
   production; the same change must also run in the Neon SQL Editor.
2. **The `VALID` answers whitelist** - three copies (frontend `CODE`/`Q_VALUES`,
   `api/share.js`, `api/capture.js`), verified identical 2026-09-07. Any question or
   option change updates all three in one commit.
3. **The capture cap of 24** (`cleanStack` in `api/capture.js`) - zero headroom against
   the max result. A new `mod()` raises the cap in the same commit.
4. **The privacy rule** - `sessions.email` and `sessions.idea` never leave the database
   into anything published, sold, or handed to a vendor. Aggregates come from
   `answers` + `stack` only.

The workflow (direct to main, no branches, ask before push) is frozen by the same
decision. Details in `.claude/skills/data-contracts/SKILL.md`.

## Definition of done

A change is done when every item holds. `/done-check` verifies them one by one.

- Targeted tests green: `node --test test/<module>.test.js` for any `api/` change
  (`npm test` when in doubt). A frontend change gets a manual look at the page, because
  `index.html` has no test coverage. Any engine change (`decide()`, `recommend()`,
  `TOOLS`, `COMPETES`, `ROLE2STAGE`, `LAYER_OF`) also gets `npm run sweep`, green.
- Every copy of a shared contract updated in the same commit (`VALID` x3, cap + card
  count, schema + Neon).
- Docs re-indexed after a big `index.html` change; at minimum, do not leave the
  freshness note above claiming more than is true.
- Nothing pushed without asking. Commit to main freely; `git push` deploys production
  and waits for a yes.
- New prose uses plain hyphens, no em dashes.

## Domain language

See CONTEXT.md at the root. Use those terms exactly.

## Session foundation (committed, applies to every session)

- `.claude/settings.json` allows normal work and denies force-push, history rewrite,
  hard reset, and reading env files.
- A SessionStart hook runs `scripts/cloud_setup.sh`: Node version check plus
  `npm install`. Environment details and network needs are in ENVIRONMENT.md.
- Gate status was last confirmed by a human, not by a session. First act of a fresh
  session: `node -v` (expect v22) and `npm test` (expect 12 pass, 3 skips). If either
  disagrees, fix the environment or report the failing contract before any feature work.
- Skills: `data-contracts` (the frozen rules above), `engine-change` (how to add or
  change tools, cards and stages safely), `run-tests`, `verify-live` (checking the
  deployed site). The reviewer agent knows this repo's failure modes by name.
