# Groundwork

The plain-language decision-and-guidance partner for people who want to understand what
they're building. Describe your app, answer a few plain questions, and Groundwork
recommends an opinionated, honest tech stack — including telling some people "you don't
need a custom stack yet" — with the reasoning for every pick, the options each pick beat,
an honest cost, a step-by-step plan, and (now) an AI read of your specific idea plus a
one-click way to spin the stack up.

## What's in it

- `index.html` — the whole frontend: the tangle canvas, the questionnaire, the
  deterministic recommendation engine, shareable results, and the "spin up your stack"
  panel. Vanilla JS, no build step.
- `api/tailor.js` — serverless function calling a hosted LLM for the AI layer: smart
  follow-up questions, an idea-specific read, and a build brief. Provider-flexible —
  **Gemini** by default, **Groq** as the alternative; set either key.
- `api/share.js` — serverless function for **short share links**, backed by Neon Postgres.
- `api/capture.js` — serverless function that banks each completed run (anonymously) plus
  opt-in emails, backed by the same Neon database. The data moat.
- `db/schema.sql` — the two tables (`stacks` for short links, `sessions` for capture).
- `db/insights.sql` — the aggregate "what founders build" queries.
- `test/` — Node's built-in test runner, no network needed.
- `vercel.json`, `.env.example`, `CLAUDE.md`, `HANDOFF.md`.

**The AI and database layers are additive.** With no env vars set, Groundwork runs as the
full deterministic advisor — nothing breaks. Add keys to switch the extra layers on.

## Run locally

Open `index.html` in a browser for the frontend. The `/api` functions need the Vercel
runtime — run the whole thing with:

```bash
npm i -g vercel
vercel dev            # serves index.html + /api locally at http://localhost:3000
```

## Tests

```bash
npm test
```

Run `npm install` once first (the tests import `@neondatabase/serverless`). Unit tests for
both serverless handlers — no keys, no database, no network. They cover the degrade-cleanly
contracts (405 on the wrong method, 501 with no key/`DATABASE_URL`, 400 on bad input) plus
the prompt builder and JSON extraction in `api/tailor.js`. The live-API tests are skipped
unless `RUN_LIVE=1` and a model key are set: `npm run test:live` (POSIX shells only — on
Windows PowerShell use `$env:RUN_LIVE=1; node --test test/`).

## Deploy — the edit → push → live loop

Already wired: this repo is connected to Vercel, so **every push to `main` auto-deploys**
and every branch gets a preview URL. Framework preset is **Other**; Vercel serves
`index.html` and runs `/api/*` as Node functions automatically (no build config).

## Switch on the AI layer (step 3)

1. Get a free Gemini API key (no credit card): https://aistudio.google.com/app/apikey
2. Vercel → project **groundwork** → **Settings → Environment Variables** → add
   `GEMINI_API_KEY` (Production + Preview). Optional: `TAILOR_MODEL` (default `gemini-2.5-flash`).
3. Redeploy (Deployments → ⋯ → Redeploy, or push a commit).

Prefer Groq instead? Set `GROQ_API_KEY` (default model `llama-3.3-70b-versatile`). If both
keys are present Gemini wins; force one with `AI_PROVIDER=gemini|groq`.

Now the idea box shows **"✨ Read my idea"** (follow-up questions + a tailored read on the
results), and the spin-up panel offers **"Generate a build brief."**

## The database — session capture + short links (Neon Postgres)

Both backend features run on one Neon Postgres database (`api/capture.js`, `api/share.js`).

Setup (once): Vercel → project **groundwork** → **Storage** → **Create Database** → **Neon**
(EU region, Free). Vercel injects `DATABASE_URL` into the env vars automatically — nothing to
paste. The schema (`db/schema.sql`, tables `sessions` + `stacks`) is already applied to the
Neon `groundwork` project; re-run it in Neon Console → SQL Editor only if you rebuild the DB.
Without `DATABASE_URL` both functions return 501 and degrade cleanly (short links fall back to
the long `?p=` link; the "Get the map" card hides itself).

**Session capture — the data moat.** Every completed run is banked anonymously in
`public.sessions`: the idea, the 8 answers, and the recommended stack. The results screen shows
a **"Get the map"** card inviting an opt-in email.

**The point:** `db/insights.sql` turns this into the aggregate "what founders build" map — tool
share by app type, funnel, trends — the anonymized asset you can show a vendor. Privacy is
designed in: sessions are anonymous (no IP/cookies), email is opt-in and lives in its own
column, and the aggregate is built only from answers + stack, never from email or raw idea
text. **Don't export the `email` or `idea` columns into anything you publish.**

## The spin-up panel (step 4)

On every result, "Spin up — provision this stack" builds, from the chosen stack:
an ordered, deep-linked setup checklist (each link opens the exact place to create that
piece — nothing is provisioned behind your back), a generated `.env.example` for exactly
the keys that stack needs, a one-click **Deploy to Vercel** button pointed at a
Next.js + Supabase starter, and (with the AI key set) a build brief to paste into Claude
Code.

## Editing

Everything on the client is in `index.html`:

- `STAGES` — the decision registry (the tool list): 16 decisions on the canvas, 18 in the
  engine, 55 tools.
- `carryBand()` / `heavyPicks()` — complexity coherence. Every tool has a `weight` 1-5; the
  answers imply a band the founder can carry, and anything heavier is named rather than
  silently swapped, so a stack is never nine trial tiers plus one thing you have to operate.
- `openCompare(stage)` — the full comparison table for one decision (cost, lock-in, weight,
  pros, cons), behind a click.
- `profile(answers)` — what the 8 answers actually mean, second-order dimensions included.
- `decide(answers)` — the single source of truth for every pick. `recommend()`,
  `graphTargets()` and `renderSpinKit()` all read from it, so the cards, the canvas and the
  provisioning panel can never disagree. Add a rule here, not in three places.
- `TOOLS` / `COMPETES` / `altsFor()` — the tool registry. Facts (what, cost, lock-in, and a
  `checked` date) separated from judgement (`against`, keyed by the founder's goal). The
  "options it beat" lines under each pick are generated from it, so they change with what
  the user said they care about. Add a tool here, not in the engine.
- `LAYERS` — results are grouped into the layers every app has ("Where it lives", "What it
  remembers", …), closing on the one layer that is actually yours.
- `counterfactual(answers, stage)` — the "had you said X, this would be Y" line under each
  pick. Computed by re-running `decide()` with each answer flipped, so it can never
  contradict the recommendation.
- `recommend(answers, idea)` — the deterministic rules engine (verdict, cards, cost, plan,
  tips). The prose reasoning lives here.
- `graphTargets()` / `applyTargets()` / `draw()` — the tangle canvas.
- share/encode helpers, `renderSpinKit()`, and the AI + capture hooks (`enhanceWithAI`,
  `renderFollowups`, `onBrief`, `captureSession`) are grouped in the last script block.

Server logic is in `api/tailor.js`, `api/share.js`, and `api/capture.js`.
