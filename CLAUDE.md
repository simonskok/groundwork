# CLAUDE.md — standing context for Groundwork

## What this is

Groundwork is a guided decision + guidance partner for non-technical and semi-technical
founders. They describe what they're building in plain words, answer 8 plain questions, and
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
npm install          # once — tests import @neondatabase/serverless
npm test             # node --test test/ — 12 pass, 3 LIVE tests skip. VERIFIED.
npm run test:live    # RUN_LIVE=1 + a model key; POSIX shells only (env-prefix syntax)
```

- **View the frontend:** open `index.html` in a browser. No build, no server needed;
  `/api/*` calls fail and the site degrades to the deterministic advisor by design.
- **Full local run incl. `/api`:** `vercel dev` (serves at :3000). UNVERIFIED — needs the
  Vercel CLI installed; not a package.json script.
- **No lint, typecheck, or build step exists.** Don't invent one.

## Where things live

```
index.html          The entire frontend: CSS (13–273), HTML (275–352), JS (354–1850)
api/tailor.js       AI layer — Gemini default / Groq fallback. 3 stages: followups/insights/brief
api/share.js        Short share links (?r=) — Neon-backed. GET resolves, POST creates
api/capture.js      Anonymous session capture (the data moat) + opt-in email. Two phases
db/schema.sql       public.stacks + public.sessions. Already applied to Neon
db/insights.sql     The aggregate "map" queries — the sellable output
test/               node:test suites for tailor.js and capture.js. No network, no DB
vercel.json         cleanUrls + security headers. Zero-config routing otherwise
```

## Pointers

Full component/deps view → **ARCHITECTURE.md**. Module graph with `file:line` →
**MODULE_MAP.md**. Symbol lookup table → **SYMBOL_INDEX.md**. Entry points and traced flows
→ **DATA_FLOW.md**. Patterns, testing, footguns → **CONVENTIONS.md**.

## Working agreement

- Edit the smallest scope that solves the task. Don't refactor or rename unrelated code.
- Consult SYMBOL_INDEX.md / MODULE_MAP.md to locate a target instead of grepping the tree —
  but **re-verify the line number with `grep -n` before editing**, see pitfalls.
- State the file path and function you are changing before you edit it.
- Don't run the full test suite unless asked; run only what covers the change
  (`node --test test/capture.test.js`). Frontend changes have no test coverage at all.
- **Deliver complete, runnable files, not patches.** End with something viewable.

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
  (`--warm`) = the value layer, where effort goes. Archivo (display), IBM Plex Sans (body),
  IBM Plex Mono (eyebrows/data/commands). Full light + dark themes, both defined explicitly.

## Known pitfalls

- **`index.html` line numbers drift constantly** — it's one 1850-line file under active
  edit. Indexed at 1811 lines, md5 `88161f28…`, 2026-09-04. Always `grep -n` to confirm a
  location before editing.
- **`needs` in `decide()` is the TRIGGER, not the full dependency set.** A stage settles on
  the canvas when the answer that makes it *meaningful* arrives, and the pick keeps
  sharpening after. Gate on full dependencies and nothing moves until the last question —
  accurate, and it feels like nothing happened.
- **`TOOLS` entries carry a `checked` date (`CHECKED`, currently `"2026-09"`).** A stale
  price in a product that promises an honest cost is a broken promise. Re-check anything
  older than ~6 months. Costs are shapes, not exact cents.
- **A card standing for several tools must pass an array** to `mod()` (e.g.
  `["framer","webflow"]`), or it lists itself among the options it beat.
- **Adding a card means adding its `role` string to `ROLE2STAGE`**, or it silently falls
  into the `build` layer and gets no counterfactual.
- **Adding a tool = one entry in `TOOLS` + its id in `COMPETES`.** It then appears wherever
  it competes, automatically, in the compare table and the "options it beat" list.
- **The `api/*` handlers are CommonJS** (`module.exports = handler`) with no framework.
  They read env **at call time**, not import time, so tests can set it dynamically.
- **`VALID` (the 8 answers whitelist) is duplicated in `api/share.js` and `api/capture.js`.**
  If you add a question or an option value, update the frontend `CODE` map AND both copies,
  or shared links and capture start rejecting valid answers with 400.
- **Never export `sessions.email` or `sessions.idea` into anything published or sold.** The
  aggregate is built from `answers` + `stack` only. That constraint is the brand.
- **`db/schema.sql` is already applied to the live Neon DB.** It's the source of truth for
  re-creation, not a migration system — there are no migrations.
