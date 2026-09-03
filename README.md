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
- `api/tailor.js` — serverless function calling **Claude** (Anthropic) for the AI layer:
  smart follow-up questions, an idea-specific read, and a build brief.
- `api/share.js` — serverless function for **short share links**, backed by Neon Postgres.
- `supabase/schema.sql` — the one table short links need.
- `vercel.json`, `.env.example`, `CLAUDE.md`.

**The AI and short-link layers are additive.** With no keys set, Groundwork runs as the
full deterministic advisor — nothing breaks. Add keys to switch the extra layers on.

## Run locally

Open `index.html` in a browser for the frontend. The `/api` functions need the Vercel
runtime — run the whole thing with:

```bash
npm i -g vercel
vercel dev            # serves index.html + /api locally at http://localhost:3000
```

## Deploy — the edit → push → live loop

Already wired: this repo is connected to Vercel, so **every push to `main` auto-deploys**
and every branch gets a preview URL. Framework preset is **Other**; Vercel serves
`index.html` and runs `/api/*` as Node functions automatically (no build config).

## Switch on the AI layer (step 3)

1. Get a free Gemini API key (no credit card): https://aistudio.google.com/app/apikey
2. Vercel → project **groundwork** → **Settings → Environment Variables** → add
   `GEMINI_API_KEY` (Production + Preview). Optional: `TAILOR_MODEL` (default `gemini-2.5-flash`).
3. Redeploy (Deployments → ⋯ → Redeploy, or push a commit).

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

- `STAGES` — the decision registry (the tool list).
- `recommend(answers, idea)` — the deterministic rules engine (verdict, cards, cost, plan,
  tips). The reasoning lives here.
- `graphTargets()` / `applyTargets()` / `draw()` — the tangle canvas.
- share/encode helpers, `renderSpinKit()`, and the AI hooks (`enhanceWithAI`,
  `renderFollowups`, `onBrief`) are grouped in the last script block.

Server logic is in `api/tailor.js` and `api/share.js`.
