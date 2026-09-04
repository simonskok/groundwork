# SYMBOL_INDEX.md — flat lookup

Sorted alphabetically. Indexed 2026-09-04 against `index.html` @ 2024 lines, md5
`33c3da718f58b159565e3e9478f9b9f3` (commit `3a1f721`). Line numbers **drift with every edit**
— confirm with:

```bash
grep -n 'function decide' index.html
```

Module names match the sections in [MODULE_MAP.md](MODULE_MAP.md).

## Frontend — `index.html`

| Symbol | Kind | File:Line | Module | One-line purpose |
|---|---|---|---|---|
| `$` | function | index.html:356 | UI wiring | `querySelector` shorthand |
| `A_LABEL` | constant | index.html:930 | Layers/labels | Answer value → prose label |
| `AI_ON` | constant | index.html:1722 | Enhancements | Flag; false once `/api/tailor` answers 404/501 |
| `aiFollow` | constant | index.html:1736 | Enhancements | `{aiKey: value}` answers to AI follow-ups |
| `aiFollowMeta` | constant | index.html:1737 | Enhancements | `[{key,label}]` for the AI follow-up questions |
| `altsFor` | function | index.html:857 | Tool registry | Generated "options it beat" for a stage, max 4 |
| `animate` | function | index.html:1433 | Canvas | Starts the rAF loop, or settles instantly under reduced motion |
| `answers` | constant | index.html:358 | Engine core | The 8-key mutable questionnaire state |
| `api` | function | index.html:1741 | Enhancements | The single fetch wrapper; 404/501 → `Error{code:"off"}` |
| `applyTargets` | function | index.html:1399 | Canvas | Node roles + link visibility + `clarity = decided/16` |
| `badge` | function | index.html:1614 | Results | Badge markup for `core`/`later`/`heads` |
| `cardHtml` | function | index.html:1618 | Results | One stack card, incl. alts, counterfactual, compare button |
| `carryBand` | function | index.html:819 | Tool registry | The operational weight this person can carry |
| `CAPTURE_ON` | constant | index.html:1723 | Enhancements | Flag; false once `/api/capture` answers 404/501 |
| `captureSession` | function | index.html:1726 | Enhancements | Phase-1 anonymous POST to `/api/capture` |
| `CENTER` | constant | index.html:382 | Canvas | The "YOU" node position |
| `CHECKED` | constant | index.html:578 | Tool registry | Freshness date on every `TOOLS` entry |
| `clarity` | constant | index.html:382 | Canvas | 0→1; drives the untangling |
| `CODE` | constant | index.html:1530 | UI wiring | Answer → single share-code character |
| `CODE_ORDER` | constant | index.html:1540 | UI wiring | Question order in the `?p=` code |
| `coherenceHtml` | constant | index.html:1634 | Results | The weight band + now/later panel |
| `COMPETES` | constant | index.html:779 | Tool registry | **26 stages** → competing tool ids, in offer order |
| `copyText` | function | index.html:1561 | UI wiring | Clipboard write with textarea fallback |
| `counterfactual` | function | index.html:955 | Counterfactuals | "Had you said X, this would be Y", or `""` |
| `css` | function | index.html:1424 | Canvas | Read a CSS custom property at draw time |
| `cv` / `ctx` | constant | index.html:1423 | Canvas | `#web` canvas element and its 2D context |
| `DECODE` | constant | index.html:1541 | UI wiring | Reverse of `CODE`, built at load |
| `decide` | function | index.html:453 | Engine core | **Single source of truth**; 24 `set()` calls |
| `decodeAnswers` | function | index.html:1544 | UI wiring | `?p=` code → answers, or falsy if malformed |
| `draw` | function | index.html:1446 | Canvas | Renders vignette, cross-links, spokes, nodes, centre |
| `enhanceWithAI` | function | index.html:1792 | Enhancements | `stage:"insights"` → idea-specific read into `#airead` |
| `encodeAnswers` | function | index.html:1543 | UI wiring | Answers → the `?p=` code |
| `esc` | function | index.html:1615 | Results | HTML-escape inside `renderResults` |
| `escAttr` | function | index.html:1739 | Enhancements | Attribute escaping (delegates to `escHtml`) |
| `escHtml` | function | index.html:1738 | Enhancements | HTML-escape for AI/model output |
| `goalKeys` | function | index.html:841 | Tool registry | Founder's goals in reach-for order |
| `graphTargets` | function | index.html:1374 | Canvas | answers → `{chosen, active, decided}` per canvas stage |
| `heavyPicks` | function | index.html:829 | Tool registry | Picks above the founder's carry band |
| `hex` | function | index.html:1445 | Canvas | `css()` with a literal fallback |
| `ID_LABEL` | constant | index.html:942 | Layers/labels | Tool id → display label (overrides at `:945–946`) |
| `ideaEl` | constant | index.html:1750 | Enhancements | The `#idea` textarea |
| `initFromURL` | function | index.html:1583 | UI wiring | Handles `?r=` and `?p=` on load |
| `joinOr` | function | index.html:948 | Counterfactuals | "a, b or c" |
| `LAYER_OF` | constant | index.html:907 | Layers/labels | All 26 stage keys → layer id |
| `LAYERS` | constant | index.html:876 | Layers/labels | The **9** structural layers and their prose |
| `layersHtml` | constant | index.html:1625 | Results | The 9 layer groups, cards grouped under each |
| `line` | function | index.html:1289 | Recommendation | Accumulates one honest cost line |
| `LINKS` | constant | index.html:382 | Canvas | Cross-links between option nodes |
| `loadShared` | function | index.html:2012 | Enhancements | GET `/api/share?id=` → restore → `showResult(true)` |
| `mdBold` | function | index.html:1740 | Enhancements | `**bold**` → `<b>` for model output |
| `mod` | function | index.html:1038 | Recommendation | Pushes one stack card (role, pick, why, badge, alts, cf) |
| `mulberry32` | function | index.html:383 | Canvas | Seeded PRNG; the tangle is identical every load |
| `newSid` | function | index.html:1725 | Enhancements | Session id, `crypto.randomUUID()` with fallback |
| `NODES` | constant | index.html:382 | Canvas | The 42 option nodes with polar position and role |
| `onBrief` | function | index.html:1945 | Enhancements | `stage:"brief"` → build brief in a modal |
| `openCompare` | function | index.html:1959 | Enhancements | Full comparison table for a stage, from `TOOLS` |
| `openModal` | function | index.html:1991 | Enhancements | Generic copyable-text modal |
| `profile` | function | index.html:401 | Engine core | Answers → the dimensions the engine reasons over |
| `Q_RANK` | constant | index.html:941 | Layers/labels | Which question makes the best counterfactual sentence |
| `Q_VALUES` | constant | index.html:924 | Layers/labels | Legal values per question |
| `recommend` | function | index.html:993 | Recommendation | The full deterministic result object |
| `reduce` | constant | index.html:357 | Canvas | `prefers-reduced-motion` |
| `renderFollowups` | function | index.html:1770 | Enhancements | Injects up to 2 AI question cards |
| `renderResults` | function | index.html:1613 | Results | Builds the entire result DOM and wires its buttons |
| `renderSpinKit` | function | index.html:1811 | Enhancements | Provisioning links, `.env`, Deploy-to-Vercel |
| `REQUIRED` | constant | index.html:359 | Engine core | The 8 keys gating submit |
| `resize` | function | index.html:1425 | Canvas | DPR-aware canvas sizing |
| `restoreAnswersUI` | function | index.html:1574 | UI wiring | Repaints `aria-pressed` after a shared load |
| `ROLE2STAGE` | constant | index.html:897 | Layers/labels | 26 card roles → stage key. **The join** |
| `set` | function | index.html:456 | Engine core | Records pick + active + needs inside `decide` |
| `shareURL` | function | index.html:1550 | UI wiring | The long `?p=` share link |
| `shortLink` | function | index.html:2003 | Enhancements | POST `/api/share` → `?r=` link, falls back to `?p=` |
| `showResult` | function | index.html:1595 | Results | Recommend → settle canvas → render |
| `SID` | constant | index.html:1724 | Enhancements | Per-run session id |
| `STAGES` | constant | index.html:362 | Engine core | **Canvas registry:** 16 stages × 42 option nodes |
| `stepHtml` | function | index.html:1808 | Enhancements | One spin-up step row |
| `summaryText` | function | index.html:1555 | UI wiring | Plain-text stack summary |
| `tick` | function | index.html:1434 | Canvas | One animation frame; eases `cur` toward `tgt` |
| `TOOLS` | constant | index.html:579 | Tool registry | **The encyclopedia.** 83 entries |
| `updateCaption` | function | index.html:1521 | UI wiring | The figure caption (counts hardcoded, stale) |
| `weightOf` | function | index.html:827 | Tool registry | A tool's operational weight, default 2 |
| `whyNot` | function | index.html:847 | Tool registry | Why a tool loses, against the founder's goal |

### Stage keys (26) → where each is decided

`decide()` sets 24; `site` and `platform` are card-only alternatives with no pick.

| Stage | `decide()` | Canvas node | Layer | Card role |
|---|---|---|---|---|
| `repo` | `:458` | yes | build | Code home |
| `build` | `:462` | yes | build | Build with |
| `site` | — | no | build | Site |
| `platform` | — | no | build | The app itself |
| `front` | `:467` | yes | live | Frontend host |
| `compute` | `:471` | yes | live | Engine host / Backend |
| `dns` | `:553` | yes | live | Domain + DNS |
| `secrets` | `:527` | yes | live | Your keys |
| `data` | `:479` | yes | remember | Data + accounts |
| `storage` | `:517` | yes | remember | Files |
| `cms` | `:530` | **no** | remember | Where the words live |
| `ai` | `:486` | yes | does | AI |
| `realtime` | `:509` | yes | does | Real-time |
| `queue` | `:513` | yes | does | Job queue |
| `search` | `:522` | yes | does | Search |
| `glue` | `:534` | **no** | does | Joining things up |
| `pay` | `:489` | yes | money | Payments |
| `email` | `:496` | yes | reach | Email |
| `support` | `:537` | **no** | reach | Talking to users |
| `marketing` | `:542` | **no** | grow | Staying in touch |
| `forms` | `:545` | **no** | grow | Forms |
| `analytics` | `:502` | yes | watch | See usage |
| `errors` | `:506` | yes | watch | Deep errors |
| `uptime` | `:550` | **no** | watch | Knowing it's down |
| `legal` | `:548` | **no** | safe | The legal bits |
| `backup` | `:551` | **no** | safe | If it all goes wrong |

### Event handlers and DOM entry points

| Handler | Kind | File:Line | Bound to | Purpose |
|---|---|---|---|---|
| option click | event handler | index.html:1509 | `.opts[data-q]` (delegated) | Record an answer, re-run the canvas |
| form submit | event handler | index.html:1607 | `#form` | Guard 8/8, then `showResult(false)` |
| results click | event handler | index.html:1690 | `#results` (delegated) | `.cmpbtn` → `openCompare(stage)` |
| idea input | event handler | index.html:1751 | `#idea` | Reveal the tailor button at ≥12 chars |
| tailor click | event handler | index.html:1756 | `#tailorbtn` | Fetch AI follow-ups |
| map submit | event handler | index.html:1704 | `#mapform` | Email opt-in → phase-2 capture |
| window resize | event handler | index.html:1506 | `window` | `resize()` |
| init | entry point | index.html:2022–2023 | — | `resize()`, then `initFromURL()` or an empty canvas |

Result-card buttons wired inside `renderResults`: `#copylink` `:1696`, `#copyshort` `:1697`,
`#copysum` `:1698`, `#startmine` `:1699`, `#again` `:1700`, `#tweak` `:1701`; plus
`#copyenv` `:1941` and `#briefbtn` `:1942` inside `renderSpinKit`.

## Backend — HTTP routes

| Route | Kind | Handler File:Line | Purpose |
|---|---|---|---|
| `POST /api/tailor` | route | api/tailor.js:163 | AI follow-ups / insights / build brief. 501 if no key |
| `GET /api/share?id=` | route | api/share.js:65 | Resolve a short id → `{answers, idea}` |
| `POST /api/share` | route | api/share.js:74 | Create a short id from answers + idea |
| `POST /api/capture` | route | api/capture.js:95 | Phase 2 — attach an opted-in email to a session |
| `POST /api/capture` | route | api/capture.js:109 | Phase 1 — anonymous session record |

## Backend — symbols

| Symbol | Kind | File:Line | Module | One-line purpose |
|---|---|---|---|---|
| `ANSWER_LABELS` | constant | api/tailor.js:53 | tailor | Answer key → prompt-friendly label |
| `answerSummary` | function | api/tailor.js:57 | tailor | Answers → one compact prompt line |
| `buildPrompt` | function | api/tailor.js:65 | tailor | Per-stage prompt + token budget |
| `callGemini` | function | api/tailor.js:137 | tailor | Gemini `generateContent`, thinking disabled |
| `callGroq` | function | api/tailor.js:116 | tailor | Groq chat completions, JSON response format |
| `cleanAnswers` | function | api/share.js:40, api/capture.js:50 | share, capture | All-or-nothing whitelist of the 8 answers |
| `cleanStack` | function | api/capture.js:61 | capture | `[{role,pick}]` sanitized, **capped at 24** |
| `connString` | function | api/share.js:14, api/capture.js:24 | share, capture | `DATABASE_URL` + 3 aliases |
| `extractJSON` | function | api/tailor.js:44 | tailor | Parse model output, fences or prose-wrapped |
| `geminiKey` | function | api/tailor.js:14 | tailor | `GEMINI_API_KEY` or `GOOGLE_API_KEY`, at call time |
| `groqKey` | function | api/tailor.js:15 | tailor | `GROQ_API_KEY`, at call time |
| `handler` | function | api/tailor.js:163 | tailor | The request handler; default export at `:196` |
| `newSid` | function | api/capture.js:73 | capture | `crypto.randomUUID()` |
| `pickProvider` | function | api/tailor.js:17 | tailor | `AI_PROVIDER` forces, else Gemini > Groq, else null |
| `readBody` | function | api/tailor.js:34, api/share.js:30, api/capture.js:40 | all three | Manual JSON body read with a size cap |
| `shortId` | function | api/share.js:50 | share | 6 chars, no ambiguous glyphs |
| `VALID` | constant | api/share.js:19, api/capture.js:29 | share, capture | The duplicated answer whitelist |
| `validEmail` | function | api/capture.js:75 | capture | Shape check, 200-char cap |
| `validSid` | function | api/capture.js:69 | capture | `[a-z0-9-]{8,40}` |
| `VOICE` | constant | api/tailor.js:28 | tailor | The system prompt |
| `_internals` | constant | api/tailor.js:198 | tailor | Test-only export surface |

## Database objects

| Symbol | Kind | File:Line | Purpose |
|---|---|---|---|
| `public.stacks` | table | db/schema.sql:10 | Short share links |
| `public.sessions` | table | db/schema.sql:20 | Session capture; `email` opt-in only |
| `sessions_created_idx` | index | db/schema.sql:34 | By `created_at` |
| `sessions_type_idx` | index | db/schema.sql:35 | By `answers->>'type'` |

## Commands

| Command | Kind | Defined in | Purpose |
|---|---|---|---|
| `npm test` | command | package.json:13 | `node --test test/` — 12 pass, 3 skip |
| `npm run test:live` | command | package.json:14 | `RUN_LIVE=1 node --test test/`; POSIX shells only |
