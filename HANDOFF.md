# Groundwork — State & Handoff

_Last updated: 2026-09-07. This file holds deployment facts, live state, and history.
How to work on the code is CLAUDE.md; what a session needs is ENVIRONMENT.md; domain
terms are CONTEXT.md. Where this file and CLAUDE.md overlap, CLAUDE.md wins._

---

## 1. What Groundwork is

See CLAUDE.md "What this is" - the source of truth for purpose, positioning, and the
feeling arc. This file does not repeat it.

---

## 2. Where it stands NOW
- **Live, public:** https://groundwork-simonskoks-projects.vercel.app
- **Repo (source of truth):** https://github.com/simonskok/groundwork (public), connected to
  Vercel → every push to `main` auto-deploys.
- **Local working copy:** `E:\Claude\groundwork` (a real git repo — edit and push from here).
- **Shipped (v3):** deterministic advisor + shareable results (`?p=` links + Neon short links)
  + spin-up panel + AI layer + session capture.
- **Additive layers, dormant without env vars (by design, safe):**
  - AI layer → needs `GEMINI_API_KEY` **or** `GROQ_API_KEY`.
  - Short links + session capture → need `DATABASE_URL` (Neon).

  With nothing set, the site runs as the full deterministic advisor — nothing breaks.
  Check what's actually set in Vercel → Settings → Environment Variables.

---

## 3. Deployment setup (clean reference)
Static frontend + Vercel serverless functions. No build step. Repo root = deploy root;
the file-by-file map is CLAUDE.md "Where things live".

- **Host:** Vercel project `groundwork`, personal account `simonskoks-projects`
  (teamId `team_MfHSc8lVdp7qcs4GvRWQQLCb`).
- **Routing:** zero-config — Vercel serves `index.html` and auto-runs every file in `/api` as a
  Node serverless function. No manual route config needed.
- **Deployment Protection:** OFF (site is public).

---

## 4. The AI layer — the SAFE way to switch it on
The key is a **server-side environment variable**. It is never committed, never in the browser.
`api/tailor.js` is provider-flexible — set **either** key:

- **Gemini** (default, free tier, no card): https://aistudio.google.com/app/apikey →
  `GEMINI_API_KEY`. Default model `gemini-2.5-flash`.
- **Groq** (free, fast): https://console.groq.com/keys → `GROQ_API_KEY`.
  Default model `llama-3.3-70b-versatile`.

Steps: Vercel → project **groundwork** → **Settings → Environment Variables** → add the key for
**Production** (and Preview) → **Redeploy** (Deployments → latest → ⋯ → Redeploy, or push a
commit).

Optional env: `TAILOR_MODEL` and `AI_PROVIDER` - the full variable table is in CLAUDE.md
"Credentials", which is the source of truth for what each unlocks.

What lights up: **"✨ Read my idea"** (follow-up questions + a tailored read on results) and
**"Generate a build brief"** in the spin-up panel. Cost is small — a few hundred tokens per call.

---

## 5. The database — short links + session capture (Neon Postgres)
One Neon database serves both `api/share.js` and `api/capture.js`.

1. Vercel → project **groundwork** → **Storage** → **Create Database** → **Neon** (EU, Free).
   Vercel injects `DATABASE_URL` automatically across environments — nothing to paste.
2. The schema in `db/schema.sql` (tables `stacks` + `sessions`) is already applied to the Neon
   `groundwork` project. Re-run it in Neon Console → SQL Editor only if you rebuild the DB.

Without `DATABASE_URL` both functions return 501 and the client degrades quietly: "Copy short
link" falls back to the long `?p=` link, and the "Get the map" card hides itself.

**Session capture is the data moat.** Every completed run is banked anonymously in
`public.sessions`; `db/insights.sql` turns the rows into the aggregate map. The privacy
rule (never export `email` or `idea` - it is what keeps this GDPR-clean) is a frozen
contract: `.claude/skills/data-contracts/SKILL.md` is the source of truth.

---

## 6. How to check it's working
- **Site up:** open the live URL — the app (canvas + 8 questions) loads, no error, no login.
- **Functions deployed:** open `…/api/tailor` in a browser → **405** (GET not allowed) means the
  function is live. 404 would mean it's missing. Without a key, a real POST returns 501 and the
  app degrades quietly.
- **AI on (after key):** type an idea (≥12 chars) → "✨ Read my idea" returns follow-up chips.
- **DB on:** finish a run, then "Copy short link" → you get a `?r=<id>` URL, not the long one.
- **Locally:** `npm test` (no keys or network needed). `npm run test:live` with a key set also
  hits the real model API.
- **Deploy status:** Vercel → Deployments → latest = **Ready**.

---

## 7. The permanent workflow (no more upload pain)
Edit locally, then from `E:\Claude\groundwork`:
```
git add .
git commit -m "what changed"
git push
```
Vercel auto-deploys. No zips, no web uploads, no folder flattening, no third-party access.
Folders are preserved by git. This replaced the file-handoff loop for good.

For AI sessions the branching and push rules are in CLAUDE.md ("Branching: there isn't
any"): direct to main, no branches, and a push waits for an explicit yes because it
deploys production.

---

## 8. What was done (roadmap steps 1–4)
1. **Ship as a real site** — DONE. Vercel + GitHub auto-deploy, public.
2. **Shareable results** — DONE. Share card (copy link/summary), `?p=` answer-encoded URLs,
   `?r=` Neon short links, "shared stack" banner.
3. **AI-tailored version** — DONE (deployed; needs `GEMINI_API_KEY` or `GROQ_API_KEY`).
   `api/tailor.js`: 1–2 smart follow-ups, an idea-specific "tailored read," and a build brief
   for Claude Code.
4. **One-click spinner** — DONE. "Spin up your stack": ordered deep-linked provisioning steps
   built from the chosen stack, a generated `.env` template, a Deploy-to-Vercel button, and an
   AI build brief. Honest scope: deep-links + one-click-deploy, not silent provisioning of your
   cloud accounts (that needs a persistent server + OAuth/token vault — a later step).

Plus, beyond the original four: **session capture** (`api/capture.js` + `db/insights.sql`) —
the anonymous "what founders build" dataset and its opt-in email list.

---

## 9. Next steps (candidates)
- **Turn on the AI layer** if it isn't already (add `GEMINI_API_KEY`, redeploy, test) — highest
  value, 5 minutes.
- Custom domain via Cloudflare (only `groundworkstack.com` was free at ~$11/yr; staying on the
  .vercel.app URL for now).
- Affiliate links on recommended tools (revenue).
- Per-user saved/named stacks (Neon Auth).
- Deeper step 4: real API provisioning of hosts (server component).
- Known polish: tangle-canvas labels crowd when chosen nodes cluster — consider a simpler
  mobile graph.

---

## 10. Design non-negotiables (don't relitigate)
CLAUDE.md "Non-negotiables" is the source of truth; this file does not repeat it. One
addition that is workflow, not design: deliver complete files, not patches - end with
something runnable.

---

## 11. Where the context lives
Source of truth is the GitHub repo (clone it). Start with `CLAUDE.md` (how to work
here, the rules, the pitfalls), then `CONTEXT.md` (terms), `ENVIRONMENT.md` (session
setup), and this file (deployment and history). The committed `.claude/` folder gives
every Claude Code session its skills, commands, reviewer, and permissions
automatically.

---

## 12. Prompt for a fresh session

> I'm working on Groundwork — an honest, plain-language tech-stack advisor for non-technical
> founders. It's a static `index.html` (vanilla JS, no build) plus Vercel serverless functions
> in `/api`, deployed from https://github.com/simonskok/groundwork and live at
> https://groundwork-simonskoks-projects.vercel.app. Read `CLAUDE.md` in the repo first —
> it holds the rules, the architecture pointers, and the design non-negotiables.
> Then help me with: `<what you want>`.
