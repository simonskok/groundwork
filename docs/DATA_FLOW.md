# DATA_FLOW.md — entry points and traced flows

Indexed 2026-09-04 against `index.html` @ 2024 lines, md5 `33c3da71…` (commit `3a1f721`).
`grep -n` to confirm. Companion to [MODULE_MAP.md](MODULE_MAP.md) and
[SYMBOL_INDEX.md](SYMBOL_INDEX.md).

## Entry points

Every way execution starts, in the whole system:

| # | Entry point | Location | Trigger |
|---|---|---|---|
| 1 | Page load / init | `index.html:2022–2023` | `resize()`, then `initFromURL()` or an empty canvas |
| 2 | Answer an option | `index.html:1509` (delegated on `.opts[data-q]`) | Click any `.opt` button |
| 3 | Submit the questionnaire | `index.html:1607` (`#form` submit) | "Light up my path" |
| 4 | Idea typed | `index.html:1751` (`#idea` input) | Reveals the tailor button at ≥12 chars |
| 5 | Ask for AI follow-ups | `index.html:1756` (`#tailorbtn` click) | → `POST /api/tailor` |
| 6 | Compare a stage | `index.html:1690` (delegated on `#results`) | `.cmpbtn` → `openCompare` |
| 7 | Share buttons | `index.html:1696–1701` | copy link / short link / summary / start over / tweak |
| 8 | Spin-up buttons | `index.html:1941–1942` | copy `.env` / generate build brief |
| 9 | Email opt-in | `index.html:1704` (`#mapform` submit) | → `POST /api/capture` phase 2 |
| 10 | Window resize | `index.html:1506` | Re-measure the canvas |
| 11 | `POST /api/tailor` | `api/tailor.js:163` | HTTP |
| 12 | `GET` / `POST /api/share` | `api/share.js:58` | HTTP |
| 13 | `POST /api/capture` | `api/capture.js:80` | HTTP |
| 14 | `npm test` | `package.json:13` | `node --test test/` |

There are no cron jobs, no webhooks, no build hooks, and no CLI.

---

## Flow 1 — Answering a question (the untangling)

The hot path. Runs on every single click, and must stay cheap.

1. `.opts[data-q]` click handler fires — `index.html:1509`.
2. Sets `aria-pressed` across the group and writes `answers[q] = data-v`.
3. Recounts filled answers, updates `#answered`, toggles `#go.disabled`.
4. `graphTargets(answers, null)` — `index.html:1374`. Calls `decide(answers)` `:1387`, then
   for each of the **16 canvas stages** checks whether all its `needs` questions are
   answered; if so the stage is `decided`, and is either marked inactive (spared) or given
   its pick. The 8 card-only stages are never consulted here.
5. `applyTargets(tg)` — `index.html:1399`. `clarity = decided / STAGES.length` (16); every
   node becomes `chosen`, `pruned`, or `pending`; cross-links survive only between two
   `pending` nodes and thin as clarity rises; `#clearfill` is set.
6. `animate()` `:1433` → `tick()` `:1434` eases each node's `cur` toward `tgt` → `draw()`
   `:1446` repaints. Under `prefers-reduced-motion`, `animate()` snaps to the settled frame
   and draws once — no rAF loop.
7. `updateCaption(n)` `:1521` re-runs `graphTargets` a second time to write the caption.

**No network, no storage.** The canvas is a pure function of `answers`.

---

## Flow 2 — Submit → the full recommendation

1. `#form` submit — `index.html:1607`. Guards on 8/8 answered, then `showResult(false)`.
2. `showResult` — `index.html:1595` — calls `recommend(answers, #idea.value)`.
3. `recommend` — `index.html:993`:
   - `decide(a)` `:994` → 24 picks; `decide` itself called `profile(a)` `index.html:401`
     to derive the second-order dimensions.
   - Verdict branch `:997–1030` — `pureSite` → "you don't need a custom stack yet";
     `internal && nonTech` → an internal-tools platform; then heavy / aiCore / marketplace /
     default.
   - Cards `:1046–1256` — up to 27 `mod()` call sites, of which a given run renders
     **17.7 on average and 24 at most** (verified across all 2592 answer combinations).
     Each `mod()` resolves `stage = ROLE2STAGE[role]`, `layer = LAYER_OF[stage]`,
     `alts = altsFor(...)` (`index.html:857` → `whyNot` `:847` → `TOOLS[id].against` keyed by
     `goalKeys(p)`), and `cf = counterfactual(a, stage)` `:955`.
   - `counterfactual` **re-enters `decide()` once per alternative answer value** — ~20 extra
     `decide` calls per card, so ~350 per result. This is the engine's whole cost.
   - Plan `:1258`, cost (`line()` `:1289`, from the picks actually made), tips `:1308`,
     then coherence `:1332` via `heavyPicks` `:829` / `carryBand` `:819`, plus the
     **now/later split** `:1338–1341` counting `badge!=="later"` against `badge==="later"`.
4. Back in `showResult`: `applyTargets(graphTargets(answers, r.graph))` settles the canvas to
   its final shape; headline/eyebrow/figcap are swapped.
5. `renderResults(r, false)` — `index.html:1613` — builds one big HTML string (9 layer groups
   `:1625` → coherence `:1634` → "what makes it yours" → cost → plan → tips → spinkit host →
   map → share) and assigns `#results.innerHTML`.
6. Button wiring `:1690–1701`, then three tail calls:
   - `renderSpinKit(r)` `:1702` → **calls `decide(answers)` again** at `:1813` rather than
     reusing `r`, which is what keeps the panel and the cards from disagreeing.
   - `enhanceWithAI(r)` `:1703` → Flow 4.
   - `captureSession(r)` `:1716`, skipped when `isShared` → Flow 5.

**Everything through step 6 works with no network and no keys.**

---

## Flow 3 — Sharing and reopening a stack

**Creating a long link:** `shareURL(answers, idea)` `index.html:1550` → `encodeAnswers`
`:1543` maps each answer to one char via `CODE` `:1530` → `?p=wynnyynds&i=<idea>`.

**Creating a short link:** `shortLink(btn)` `:2003` → `api("/api/share", {answers, idea})` →
`api/share.js:74` → `cleanAnswers` `:40` (all-or-nothing whitelist) → `shortId()` `:50` →
`insert into public.stacks` `:80` → `{id}` → copies `?r=<id>`. **On any failure it silently
falls back to copying the long `?p=` link.**

**Reopening:** page load → `initFromURL()` `index.html:1583`.
- `?r=<id>` → `loadShared(id)` `:2012` → `GET /api/share?id=` → `api/share.js:65` →
  `select answers, idea from public.stacks` → `restoreAnswersUI()` `:1574` →
  `showResult(true)`. On any failure it falls back to an empty canvas.
- `?p=<code>` → `decodeAnswers` `:1544` → `showResult(true)`.

`isShared = true` suppresses the email-opt-in card and session capture, and swaps the copy
("Here's this stack" rather than "Here's your stack").

**The share code encodes only the 8 answers** — not the AI follow-ups, and not the idea
beyond 200 characters. A reopened link re-derives everything else from `decide()`.

---

## Flow 4 — AI tailoring (three independent, optional round trips)

All three go through `api(path, payload)` `index.html:1741`, whose only job is: a 404 or 501
becomes `Error{code:"off"}`, which flips `AI_ON = false` and hides the feature for good.

**a) Follow-ups** — `#tailorbtn` `:1756` → `POST /api/tailor {stage:"followups", idea, answers}`
→ `api/tailor.js:163` → `pickProvider()` `:17` → `buildPrompt` `:70` (400 tokens) →
`callGemini` `:137` or `callGroq` `:116` → `extractJSON` `:44` → `{read, questions[]}` →
`renderFollowups(d)` `index.html:1770` injects up to 2 question cards; answers land in
`aiFollow` `:1736`. **These answers never reach `decide()`** — they only sharpen the AI's
own later read.

**b) Insights** — `enhanceWithAI(r)` `:1792`, fired automatically after results render →
`{stage:"insights", idea, answers, followups, verdict, stack}` → `buildPrompt` `:99` (500
tokens) → `{title, insights[]}` → rendered into `#airead` through `mdBold(escHtml(...))`
at `:1799`.

**c) Build brief** — `#briefbtn` `:1942` → `onBrief(r, btn)` `:1945` →
`{stage:"brief", idea, approach, stack, plan}` → `buildPrompt` `:83` (950 tokens) →
`{brief}` → `openModal` `:1991` as copyable markdown.

With no key set, `/api/tailor` returns **501** at `api/tailor.js:170` and the user sees
nothing missing except the buttons.

---

## Flow 5 — Session capture (the data moat), two phases

**Phase 1, anonymous** — `captureSession(r)` `index.html:1726`, called once per completed
non-shared run:
1. `SID = newSid()` `:1725` — a client-generated UUID. No cookie, so a reload is a new session.
2. `POST /api/capture {sid, answers, verdict, approach, idea, stack:[{role,pick}], source:"web"}`.
3. `api/capture.js:109` → `cleanAnswers` `:50` + `cleanStack` `:61` → `insert into
   public.sessions … on conflict (id) do update` `:116`.
4. A 404/501 sets `CAPTURE_ON = false` **and hides the map card**, so nobody is asked for an
   email that cannot be stored.

⚠ `cleanStack` truncates at 24 entries `api/capture.js:63`, and the verified maximum result
is exactly 24 cards. Nothing is lost today; adding one more card starts silently dropping
the tail for the heaviest profiles.

**Phase 2, opted-in email** — `#mapform` submit `index.html:1704`:
1. Client-side email shape check; reuses `SID`, or mints one if phase 1 never ran.
2. `POST /api/capture {sid, email, consent:true}` → `api/capture.js:95` → requires
   `consent === true` (400 `consent_required` otherwise) → upserts `email`, `consent`,
   `email_at` onto the same row.
3. Success replaces the card with a confirmation; failure restores the button and says so.

**Read path:** `db/insights.sql` — aggregates over `answers` + `stack` only. Query 3
(`db/insights.sql:24`) is tool share across sessions. `email` and `idea` are excluded from
every published aggregate by design.

---

## Flow 6 — Comparing a stage

1. `.cmpbtn` click, caught by the delegated `#results` handler `index.html:1690`.
2. `openCompare(stage)` `:1959` → `decide(answers)` again `:1961` for the current pick, plus
   `carryBand(p)` for the founder's weight band.
3. Renders every `COMPETES[stage]` tool as a table row straight from `TOOLS` — cost, lock-in,
   what it asks of you (weight), pros ("For") and cons ("Against"), with the current pick
   highlighted and `CHECKED` printed as the freshness caveat.

This is the only surface that shows the encyclopedia raw, and it is generated — nothing about
a comparison is authored per stage.

---

## State and side-effect map

| State | Lives at | Who mutates it | Notes |
|---|---|---|---|
| `answers` | `index.html:358` | Option click handler `:1509`; `initFromURL` `:1583`; `loadShared` `:2012` | The one true input. Everything downstream is derived |
| `NODES` / `LINKS` / `clarity` | `index.html:382` | `layout()` once `:384`; `applyTargets` `:1399`; `tick` `:1434` | Canvas-only; never read by the engine |
| `raf` / `t0` | `index.html:1432` | `animate` / `tick` | rAF handle; a single loop at a time |
| `AI_ON` / `CAPTURE_ON` | `index.html:1722–1723` | `api()` `:1741`, `captureSession`, `onBrief` catch | One-way latches: once off, off for the page's life |
| `SID` | `index.html:1724` | `captureSession` `:1726`, `#mapform` handler | Links the anonymous row to a later email |
| `aiFollow` / `aiFollowMeta` | `index.html:1736–1737` | `renderFollowups` `:1770` and its chip clicks | Never feeds `decide()` |
| `#results.innerHTML` | DOM | `renderResults` `:1613` | Wholesale replacement; button handlers re-bound each time |
| `public.stacks` | Neon | `api/share.js:80` (insert only) | Never updated or deleted |
| `public.sessions` | Neon | `api/capture.js:99` and `:116` (upsert on `sid`) | The only mutable server state |

**Nothing is persisted in the browser** — no `localStorage`, no `sessionStorage`, no cookies.
Reload and the run is gone; the URL is the only save format.

**Module-load side effects (in order):** the `layout()` IIFE `index.html:384` builds the
tangle; `ID_LABEL` is populated from `STAGES` `:942`; `DECODE` is built from `CODE` `:1541`;
handlers bind at `:1506`, `:1509`, `:1607`, `:1751`, `:1756`; then `resize()` and
`initFromURL()` at `:2022–2023`.
