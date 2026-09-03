# Groundwork — State & Handoff

_Last updated: 2026-09-02. Paste the prompt at the bottom into a fresh chat to continue._

---

## 1. What Groundwork is
The plain-language, honest tech-stack advisor for non-technical and semi-technical founders.
Describe your app, answer 8 plain questions, and it recommends an opinionated stack — including
telling some people "you don't need a custom stack yet" — with the reasoning for every pick,
the options each beat, an honest cost, a step-by-step plan, an AI read of your specific idea,
and a one-click "spin it up" panel. Signature: a tangle canvas that resolves from a menacing
knot into one lit path (trapped → free).

---

## 2. Where it stands NOW (live)
- **Live, public:** https://groundwork-simonskoks-projects.vercel.app
- **Repo (source of truth):** https://github.com/simonskok/groundwork (public), connected to
  Vercel → every push to `main` auto-deploys.
- **Local working copy:** `C:\Users\simonskok\Desktop\groundworkstructured\groundwork`
  (a real git repo — this is where you edit and push from).
- **Shipped (v3):** deterministic advisor + shareable results (`?p=` links + Supabase short
  links) + spin-up panel + AI hooks. Verified: homepage loads; `/api/tailor` returns HTTP 405
  to a GET = the serverless function is deployed and running.
- **Dormant until keys are added (by design, safe):**
  - AI layer → needs `ANTHROPIC_API_KEY`.
  - Short links → need `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
  With no keys, the site runs as the full deterministic advisor — nothing breaks.

---

## 3. Deployment setup (clean reference)
Static frontend + Vercel serverless functions. No build step.

```
groundwork/                 (repo root = deploy root)
├── index.html              frontend: canvas, questionnaire, engine, sharing, spin-up, AI hooks
├── vercel.json             standard zero-config (cleanUrls + security headers)
├── package.json            marks Node >=18 (no dependencies)
├── api/
│   ├── tailor.js           →  /api/tailor   (Claude: follow-ups, idea read, build brief)
│   └── share.js            →  /api/share    (Supabase: short links)
├── supabase/
│   └── schema.sql          the `stacks` table for short links
├── .env.example            documents every env var
├── README.md
└── CLAUDE.md               standing context for AI coding tools
```

- **Host:** Vercel project `groundwork`, personal account `simonskoks-projects`
  (teamId `team_MfHSc8lVdp7qcs4GvRWQQLCb`).
- **Routing:** zero-config — Vercel serves `index.html` and auto-runs every file in `/api` as a
  Node serverless function. No manual route config needed.
- **Deployment Protection:** OFF (site is public).

---

## 4. The AI layer — the SAFE way to switch it on
The key is a **server-side environment variable**. It is never committed, never in the browser.

1. Get a key: https://console.anthropic.com/
2. Vercel → project **groundwork** → **Settings → Environment Variables**:
   - Name: `ANTHROPIC_API_KEY`, Value: `<your key>`, Environments: **Production** (and Preview).
   - (Optional) `TAILOR_MODEL` — defaults to `claude-3-5-haiku-latest` (cheap, fast).
3. **Redeploy:** Deployments → latest → ⋯ → **Redeploy** (or just push any commit).

Cost is small: it uses Haiku, a few hundred tokens per call. Set a spend limit in the Anthropic
console if you want a hard ceiling. What lights up: **"✨ Read my idea"** (follow-up questions +
a tailored read on results) and **"Generate a build brief"** in the spin-up panel.

---

## 5. Short links (optional, Supabase)
1. Create a project: https://supabase.com/dashboard/new
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. Settings → API → copy **Project URL** and the **service_role** key.
4. Vercel env: add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-only). Redeploy.

Then "Copy short link" saves the result and returns a tidy `?r=<id>` URL. Without Supabase it
silently falls back to the long `?p=` link (no backend needed).

---

## 6. How to check it's working
- **Site up:** open the live URL — the app (canvas + 8 questions) loads, no error, no login.
- **Functions deployed:** open `…/api/tailor` in a browser → **405** (GET not allowed) means the
  function is live. 404 would mean it's missing. Without the key, a real POST returns 501 and the
  app degrades quietly.
- **AI on (after key):** type an idea (≥12 chars) → "✨ Read my idea" returns follow-up chips.
- **Deploy status:** Vercel → Deployments → latest = **Ready**.

---

## 7. The permanent workflow (no more upload pain)
Edit locally, then from `…\groundworkstructured\groundwork`:
```
git add .
git commit -m "what changed"
git push
```
Vercel auto-deploys. No zips, no web uploads, no folder flattening, no third-party access.
Folders are preserved by git. This replaced the file-handoff loop for good.

---

## 8. What was done (roadmap steps 1–4)
1. **Ship as a real site** — DONE. Vercel + GitHub auto-deploy, public.
2. **Shareable results** — DONE. Share card (copy link/summary), `?p=` answer-encoded URLs,
   `?r=` Supabase short links, "shared stack" banner.
3. **AI-tailored version** — DONE (deployed; needs `ANTHROPIC_API_KEY`). `api/tailor.js` (Claude):
   1–2 smart follow-ups, an idea-specific "tailored read," and a build brief for Claude Code.
4. **One-click spinner** — DONE. "Spin up your stack": ordered deep-linked provisioning steps
   built from the chosen stack, a generated `.env` template, a Deploy-to-Vercel button, and an
   AI build brief. Honest scope: deep-links + one-click-deploy, not silent provisioning of your
   cloud accounts (that needs a persistent server + OAuth/token vault — a later step).

---

## 9. Next steps (candidates)
- **Turn on the AI layer** (add `ANTHROPIC_API_KEY`, redeploy, test) — highest value, 5 minutes.
- Optional: short links (Supabase), custom domain via Cloudflare (only `groundworkstack.com`
  was free at ~$11/yr; staying on the .vercel.app URL for now).
- Affiliate links on recommended tools (revenue).
- Per-user saved/named stacks (Supabase auth).
- Deeper step 4: real API provisioning of hosts (server component).
- Known polish: tangle-canvas labels crowd when chosen nodes cluster — consider a simpler
  mobile graph.

---

## 10. Design non-negotiables (don't relitigate)
- Honesty is the product — sometimes recommend LESS; never upsell complexity.
- Reasoning over answers — every pick shows the options it beat.
- The canvas conveys feeling; the cards carry the legible detail.
- Plain language; jargon only behind a click.
- Visual identity: cool = infrastructure, warm amber = value layer; Archivo + IBM Plex Sans +
  IBM Plex Mono; full light/dark.
- Deliver complete files, not patches. End with something runnable.

---

## 11. Files the next chat needs
Source of truth is the GitHub repo (clone it). The files that matter: `index.html`,
`api/tailor.js`, `api/share.js`, `vercel.json`, `package.json`, `supabase/schema.sql`,
`.env.example`, `README.md`, `CLAUDE.md`, and this `HANDOFF.md`.
