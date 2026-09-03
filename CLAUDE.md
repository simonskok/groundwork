# CLAUDE.md — standing context for Groundwork

Read this first. It's the context so you never have to re-explain the project.

## What Groundwork is

A guided decision + guidance partner for non-technical and semi-technical founders. The
user describes what they're building in plain words, answers a few plain questions, and
Groundwork recommends an opinionated, **honest** tech stack — including telling some people
"you don't need a custom stack yet" — with the reasoning for every pick, the options each
pick beat, an honest cost, and a step-by-step plan.

The signature is a live canvas: decisions begin as a menacing tangled knot of options
around a central "YOU" node; as the user answers, cross-links are cut, branches grey out,
and one clear lit path emerges. The feeling arc is **trapped → free**.

## Positioning

The gap between developer discovery tools (StackShare), learning roadmaps (roadmap.sh),
black-box AI app builders (Lovable/Bolt/v0), and code-first boilerplates
(ShipFast/Supastarter). The wedge is plain-language, honest guidance for people who want to
understand what they're building.

## Architecture (v3)

Static frontend + Vercel serverless functions, no build step:

- `index.html` — frontend: canvas, questionnaire, deterministic engine, shareable results,
  spin-up panel, AI hooks.
- `api/tailor.js` — AI layer (Gemini default / Groq fallback): follow-ups, idea read, build brief.
- `api/share.js` — Neon-backed short share links.
- `api/capture.js` — Neon-backed session capture (the data moat).
- `db/schema.sql` — the `stacks` + `sessions` tables. `db/insights.sql` — the aggregate map queries.

**AI + database features are additive and degrade cleanly:** with no env vars, the site runs as
the full deterministic advisor. Env: `GEMINI_API_KEY` or `GROQ_API_KEY` (+ optional
`TAILOR_MODEL`, `AI_PROVIDER`); `DATABASE_URL` (Neon — auto-set by the Vercel↔Neon integration).
See `.env.example` and README.

## How to work on it

Frontend is `index.html` — vanilla JS, no build, Google Fonts only. Key structures:

- `STAGES` — the decision registry (the tool list / tentacles). Add/remove tools here.
- `recommend(answers, idea)` — the deterministic rules engine: verdict, build approach,
  stack cards (each with a badge and an "options it beat" with a one-line why-not), honest
  monthly cost, tailored ordered plan, situation-aware tips. **The reasoning lives here** —
  extend it to sharpen recommendations.
- `graphTargets()` / `applyTargets()` — map answers → node roles (pending/chosen/pruned)
  and cross-link visibility; drive the canvas.
- `draw()` — the tangle → path rendering (menace vignette, cross-links, spokes, nodes,
  centre). `clarity` (0→1) drives the untangling.

## Non-negotiables (design reasoning — don't relitigate)

- **Honesty is the product.** The advisor must sometimes recommend LESS (e.g. no-code for a
  simple site). Never upsell complexity.
- **Reasoning over answers.** Every pick shows the options it beat and why.
- **The tangle conveys feeling; the cards carry the legible detail.** The canvas is
  deliberately not the reading surface on mobile.
- **Plain, human language.** Technical jargon only behind a click, never in plain sight.
- **Visual identity.** Cool = infrastructure (set once, forget); warm amber = the value
  layer (where effort goes). Type: Archivo (display), IBM Plex Sans (body), IBM Plex Mono
  (eyebrows/data/commands). Full light + dark themes. Keep consistent.
- **Deliver complete files, not patches.** End with something runnable/viewable.

## Roadmap

1. **Ship as a real site** — DONE. Static frontend on Vercel, GitHub auto-deploy, public.
2. **Shareable results** — DONE. "Copy my stack" card + `?p=` URL encoding the answers;
   `?r=` short links via Neon Postgres.
3. **AI-tailored version** — DONE (needs `GEMINI_API_KEY`). Reads the idea, asks 1–2
   smart follow-ups, weaves an idea-specific read into the result. First use of a model API.
4. **One-click spinner** — DONE (deep-link + one-click-deploy form). "Spin up your stack":
   ordered provisioning links, generated `.env`, Deploy-to-Vercel button, AI build brief.
   Future deepening: true API provisioning of the hosts (OAuth apps + token vault) — needs
   a persistent server component, out of scope for the static+functions setup.

Next candidates: server-side provisioning; affiliate links on the recommended tools;
saving/opening named stacks per user (Neon Auth).

Business model: free advisor for reach → paid guidance/provisioning → affiliate revenue
(many recommended tools pay referral commissions) → premium templates / done-for-you.

## Deploy

Static site → Vercel (Import the GitHub repo, framework preset "Other"). Every push
auto-deploys. Make it public by turning off Vercel Authentication under Settings →
Deployment Protection. See README.md.
