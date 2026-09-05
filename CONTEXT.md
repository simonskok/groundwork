# CONTEXT.md - domain language

The terms this project uses that an outsider would not know. Alphabetical. Use them exactly
as defined here; if a term is missing, add it rather than inventing a synonym.

Engine internals (`decide`, `recommend`, `profile`, `counterfactual`, `mod`, `carryBand`,
`heavyPicks`) are documented in [CLAUDE.md](CLAUDE.md) and
[docs/MODULE_MAP.md](docs/MODULE_MAP.md), not here.

---

**501 state, the** - what every `/api` route returns when its key or `DATABASE_URL` is absent.
Not an error: it is the designed state. The client turns 404 and 501 into `Error{code:"off"}`,
latches that feature off, and hides its control. With no env vars set at all, the whole site
is in the 501 state and is still the full deterministic advisor.

**additive layer** - a feature that switches on with an environment variable and is invisible
without it. There are two: AI tailoring (`GEMINI_API_KEY` or `GROQ_API_KEY`) and the database
(`DATABASE_URL`). An additive layer may never be a dependency of the core recommendation.

**against** - the judgement half of a `TOOLS` entry: why this tool loses to the pick, keyed by
what the founder said they care about, with `any` as the fallback. Facts (`what`, `cost`,
`lockin`, `checked`) live beside it and are kept separate from it on purpose.

**capture** - `api/capture.js` writing a completed run into `public.sessions`: the idea, the
eight answers, and the recommended stack, anonymously, with no IP and no cookies. Email is a
separate opt-in column. See **data moat**.

**CHECKED** - the single date constant stamped on every `TOOLS` entry as its `checked` field,
currently `"2026-09"`. It is when the costs were last verified. A stale price in a product
that promises an honest cost is a broken promise.

**COMPETES** - the full decision set: 26 decisions, each mapping to the list of tool ids that
compete for it. Larger than **STAGES** on purpose. A tool appears in the compare table and in
every "options it beat" list by virtue of being listed here.

**data moat, the** - the accumulated `public.sessions` rows, turned by `db/insights.sql` into
the aggregate picture of what founders actually build: tool share by app type, funnel, trends.
The asset worth showing a vendor. Built from `answers` + `stack` only - never from `email` or
`idea`, which is what keeps it publishable.

**degrade cleanly** - the contract that a missing key, a failed fetch or a dead route must
never take the deterministic result down with it. Short link falls back to the long link, the
clipboard API falls back to a hidden textarea, and every enhancement is wrapped at its call
site.

**honest cost, the** - the cost line on a recommendation, expressed as a shape ("free tier,
then about $25/mo") rather than exact cents. It must include what the founder will actually
pay, including the parts that are not free.

**LAYERS** - the nine groups the result cards are sorted into, each with a plain-language title
and a sentence explaining why that layer exists at all: "How you build it", "Where it lives",
"What it remembers", and so on. The results close on the layer that is actually the founder's
own work.

**map, the** - two related things. The aggregate output of `db/insights.sql` (see **data
moat**), and the "Get the map" card on the results screen that invites an opt-in email in
exchange for it.

**Neon** - the serverless Postgres provider holding the two tables (`stacks`, `sessions`).
`DATABASE_URL` is injected automatically by the Vercel-Neon integration; nobody pastes it.
Also a tool the advisor can recommend, which is a different use of the word - say "the Neon
database" when you mean ours.

**options it beat, the** - the line under every recommended pick naming the real alternatives
and why each lost, generated from `TOOLS` and `COMPETES` against the founder's stated goal.
Never hand-written per branch. This is the product's core promise: reasoning over answers.

**?p= link** - a shareable result URL with the eight answers encoded directly into the query
string. Works with no database at all, and is the fallback whenever short links are off.

**?r= link** - a short share link: an id resolved by `api/share.js` against the `stacks` table
in Neon. Needs `DATABASE_URL`; without it the app quietly hands out a **?p= link** instead.

**ROLE2STAGE** - the map from a card's `role` string to its decision key. A `mod()` role
missing from it silently gets an empty stage, falls into the `build` layer, and loses its
counterfactual and its compare button. No error is thrown.

**shared stack** - the state of the page when it was opened from a **?p=** or **?r= link**.
The eyebrow reads "A shared stack" and a banner invites the reader to build their own.

**short link** - see **?r= link**.

**spin-up panel** - the "Spin up - provision this stack" section on a result: an ordered,
deep-linked setup checklist, a generated `.env.example` for exactly that stack's keys, a
Deploy to Vercel button, and (with an AI key set) a build brief. It deep-links and it deploys
a starter; it never provisions anything in the founder's accounts silently.

**STAGES** - the 16 decisions drawn on the canvas. Deliberately fewer than **COMPETES** (26),
because the canvas only labels chosen nodes and extra tentacles crowd it without adding any
feeling. Adding a decision usually means `COMPETES`, not `STAGES`.

**tangle, the** - the canvas: a knot of option nodes around a "YOU" node that resolves into
one lit path as answers land. Generated from a fixed seed so it is identical on every load.
It carries the feeling; the cards carry the legible detail.

**TOOLS** - the tool registry: 83 entries, each holding what the tool is, its cost, its
lock-in, its `checked` date, its `weight`, pros, cons, and its **against** lines. The authored
reasoning here is the moat. Add a tool here, not in the engine.

**trapped -> free** - the intended feeling arc of the whole product. The landing state is a
whole undecided knot, and nothing may be lit before the first answer; the payoff is one clear
path. Any change that lights something early destroys the first half of the arc.

**Vercel function** - one file in `api/`, run by Vercel as a Node serverless function with no
routing config. Three exist: `tailor`, `share`, `capture`. Each is self-contained CommonJS
and reads its environment at call time.

**weight** - a 1-5 number on every tool for how much operating effort it demands. The eight
answers imply a band the founder can carry; anything heavier is named out loud rather than
silently swapped, so a stack is never nine trial tiers plus one thing you have to run.
