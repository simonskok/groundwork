# CONTEXT.md - domain glossary

Terms this project uses, alphabetical. Each entry points at its source of truth; the
source wins over this summary. Line numbers drift in `index.html` - locate symbols with
`grep -n`, not from memory.

- **answers** - the 8 questionnaire choices (type, accounts, pay, heavy, ai, realtime,
  comfort, priority). Declared in `answers`/`REQUIRED` (index.html); value space in
  `VALID` (see below). The idea text is a ninth, optional input - the submit gate is the
  eight, so a blank idea never blocks anyone.
- **api()** - the client-side wrapper every `/api` call goes through (index.html). Turns
  404/501 into `Error{code:"off"}` so the caller can latch its feature off and hide the
  control. The mechanics of degrade-clean.
- **capture / session capture** - `api/capture.js` banking every completed run
  anonymously into `public.sessions`. Two phases: the anonymous record, then an optional
  opt-in email attached to the same session id.
- **card** - one recommendation row in the results, produced by a `mod()` call inside
  `recommend()`. Carries role, pick, why, badge (now/later), and the options it beat.
- **CHECKED / checked date** - the freshness stamp on every `TOOLS` entry (currently
  "2026-09", 83 entries). A stale price in a product that promises an honest cost is a
  broken promise; re-check anything older than about 6 months.
- **CODE / CODE_ORDER** - the frontend map encoding the 8 answers into the short `?p=`
  string, one character per answer (index.html). Third copy of the VALID value space.
- **COMPETES** - the full decision set: 26 stages, each listing the tool ids that compete
  there (index.html). Superset of the canvas `STAGES`.
- **counterfactual** - "what would have changed this pick": every answer is flipped
  through its other `Q_VALUES` and `decide()` re-runs. Never hand-written; it is the
  rules asked a different question.
- **data moat** - the anonymous aggregate built from `sessions.answers` + `sessions.stack`
  by `db/insights.sql`: what founders build and which tools win. Never includes email or
  idea text.
- **decide()** - the deterministic engine and single source of truth for every pick
  (index.html). `recommend()`, `graphTargets()`, `renderSpinKit()` and `openCompare()`
  all read from it; nothing re-derives a pick.
- **degrade clean** - the designed no-key state: with no env vars set, every `/api` route
  returns 501 and the frontend hides that feature silently. The deterministic advisor is
  the full product, not a fallback.
- **deterministic advisor** - the product with zero env vars: questionnaire, engine,
  canvas, results, `?p=` sharing. Everything that works with no server help.
- **idea** - the founder's free-text description. Stored in `stacks.idea` and
  `sessions.idea`; feeds the AI tailor. Never exported into anything published or sold.
- **LAYERS / LAYER_OF** - the 9 plain-language groups the results render under ("How you
  build it", "Where it lives", ...). `LAYER_OF` maps stage key to layer (index.html).
- **mod()** - the function inside `recommend()` that emits one card. A card standing for
  several tools passes an array of ids, or it lists itself among the options it beat.
- **needs** - per-stage trigger in `decide()`: the answers that make a stage settle on
  the canvas, deliberately smaller than the full dependency set so the knot untangles as
  answers land rather than all at the end.
- **now / later** - the badge split on cards. "Start here" (now) must mean the minimum
  that gets you live; sweep mean is about 12 now-cards, and past that something gets
  demoted.
- **Q_VALUES / A_LABEL** - the counterfactual value space and the plain-word labels for
  every answer value (index.html). Miss `Q_VALUES` when adding a question and
  counterfactuals silently ignore it.
- **ROLE2STAGE** - the map from a card's role string to its stage key (index.html). A
  role missing here silently lands in the build layer with no counterfactual and no
  compare button.
- **share link** - `?p=` is the answer-encoded long link (works with no database);
  `?r=<id>` is the Neon-backed short link from `api/share.js` and `public.stacks`.
- **spin-up panel** - "Spin up your stack": ordered deep links, a generated `.env`
  template, a Deploy-to-Vercel button and an AI build brief, rendered by
  `renderSpinKit()` from `decide()`'s picks.
- **STAGES** - the 16 canvas stages (the tentacles of the tangle). Not the decision set:
  the engine decides 26 stages and emits up to 24 cards; the newer founder-facing
  decisions are cards only.
- **stacks** - the `public.stacks` table: short share links (id, answers, idea).
- **sweep** - the headless engine run: extract the DOM-free region of `index.html`, loop
  all 2592 answer combinations, assert on the cards. Recipe in docs/CONVENTIONS.md
  (Testing). Run it after any `decide()`/`recommend()` change.
- **tailor / tailor stages** - `api/tailor.js`, the AI layer. Three stages by request
  body: `followups` (1-2 smart questions), `insights` (the tailored read, the default),
  `brief` (a build brief for an AI coding tool). Gemini default, Groq fallback, 501 with
  no key.
- **tangle canvas** - the signature visual: a knot of options around a "YOU" node that
  resolves into one lit path as answers land. Feeling arc: trapped to free. Fixed seed;
  the knot is identical on every load by design.
- **TOOLS** - the tool registry (83 entries): facts (`what`, `cost`, `lockin`, `checked`)
  plus goal-keyed judgement (`against`). The authored reasoning in it is the moat.
  Adding a tool = one `TOOLS` entry + its id in `COMPETES`; everything else follows.
- **VALID** - the whitelist of legal answer values. Three copies that must stay
  identical: frontend (`Q_VALUES`/`CODE`), `api/share.js`, `api/capture.js`. Frozen
  contract; verified identical 2026-09-07.
- **verdict / approach** - the headline recommendation and the "how to build it" line,
  captured per session into `public.sessions`.
