# MODULE_MAP.md — the knowledge graph

Groundwork has 4 source files of consequence. `index.html` is one file with **no module
system**, so its logical sections are treated as modules here: every `var`/`function` in the
script block is a sibling in one global scope, which means "public surface" = "everything",
and the edges below are *call* edges, not import edges.

Indexed 2026-09-04 against `index.html` @ 2024 lines, md5 `33c3da71…` (commit `3a1f721`).
**`grep -n` to confirm before editing.** Flat lookup: [SYMBOL_INDEX.md](SYMBOL_INDEX.md).

---

## 1. Engine core — state, stages, profile, decide

**Root:** `index.html:356–577`

Turns 8 thin answers into 24 picks. This is the module everything else reads from.

| Symbol | file:line | Purpose |
|---|---|---|
| `answers` | `index.html:358` | The 8-key mutable global holding questionnaire state |
| `REQUIRED` | `index.html:359` | The 8 keys that must be filled before submit unlocks |
| `STAGES` | `index.html:362` | **Canvas registry only:** 16 stages × 42 option nodes. Not the full decision set |
| `profile(a)` | `index.html:401` | Answers → the dimensions the engine reasons over, incl. second-order ones no question asks (`payouts`, `globalDigital`, `aiCore`, `orgs`, `seo`, `publicFacing`, `pureSite`) |
| `decide(a)` | `index.html:453` | **Single source of truth.** 24 `set()` calls → `{p, pick, active, needs}` |
| `set(stage,id,on,dep)` | `index.html:456` | Local helper inside `decide` — records the pick, whether the stage is in play, and its trigger answers |

The 24 stages, in `decide()` order: `repo` `:458`, `build` `:462`, `front` `:467`,
`compute` `:471`, `data` `:479`, `ai` `:486`, `pay` `:489`, `email` `:496`,
`analytics` `:502`, `errors` `:506`, `realtime` `:509`, `queue` `:513`, `storage` `:517`,
`search` `:522`, `secrets` `:527`, `cms` `:530`, `glue` `:534`, `support` `:537`,
`marketing` `:542`, `forms` `:545`, `legal` `:548`, `uptime` `:550`, `backup` `:551`,
`dns` `:553`. The last 8 (`cms` → `backup`) are **cards only, never canvas nodes**.

`needs` is the **trigger**, not the full dependency set — see the pitfall in CLAUDE.md.

- **Depends on:** nothing. `decide` is a pure function of `answers`.
- **Depended on by:** every other frontend module.
- **Key types:** `Answers {type,accounts,pay,heavy,ai,realtime,comfort,priority}`;
  `Profile` (~30 booleans); `Decision {p, pick:{stage→toolId}, active:{stage→bool}, needs:{stage→[question]}}`.

---

## 2. Tool registry — the encyclopedia

**Root:** `index.html:578–874`. **83 tools across 26 stages.**

One entry per tool, split into FACTS (`what`/`cost`/`lockin`/`checked`) and JUDGEMENT
(`against`, keyed by goal). The "options it beat" lines are **generated** from this against
what the founder said they want — never hand-written per branch.

| Symbol | file:line | Purpose |
|---|---|---|
| `CHECKED` | `index.html:578` | The freshness date stamped on every entry (`"2026-09"`) |
| `TOOLS` | `index.html:579` | 83 entries: `{name, stage, what, cost, lockin, checked, weight, pros, cons, against}` |
| `COMPETES` | `index.html:779` | **26 stages** → ordered competing tool ids. The full decision set |
| `carryBand(p)` | `index.html:819` | How much operational weight this **person** can carry — never what the problem demands |
| `weightOf(id)` | `index.html:827` | Tool's operational weight, 1 (forget it) → 5 (running infrastructure) |
| `heavyPicks(pick,active,p)` | `index.html:829` | The picks above the founder's band — named with a reason, not silently swapped |
| `goalKeys(p)` | `index.html:841` | The founder's goals in reach-for order: cost, scale, speed, nontech, dev |
| `whyNot(id,p)` | `index.html:847` | One why-not line for a tool, resolved against the goal (`against.any` is the fallback) |
| `altsFor(stage,chosen,p,extra)` | `index.html:857` | The generated "options it beat" list, max 4. `chosen` accepts an **array** for multi-tool cards |

- **Depends on:** Engine core (`profile` output).
- **Depended on by:** Recommendation engine (cards + coherence), Results rendering
  (`openCompare` table).
- **Adding a tool:** one entry in `TOOLS` + its id in `COMPETES`. It then appears everywhere
  it competes, automatically. **Deliberately not covered:** Kubernetes, service meshes,
  Terraform, Kafka, Prometheus, data warehouses, CI beyond push-to-deploy — that is
  positioning, not an oversight.

---

## 3. Layers and labels — the structural view

**Root:** `index.html:876–946`

Groups flat picks into the 9 layers every app has, so a first-timer has something to hang
them on and can see that most of it is already solved.

| Symbol | file:line | Purpose |
|---|---|---|
| `LAYERS` | `index.html:876` | **9 layers**: `build`, `live`, `remember`, `does`, `money`, `reach`, `grow`, `watch`, `safe` — each with a plain-language "what breaks without it" |
| `ROLE2STAGE` | `index.html:897` | 26 card `role` strings → stage key. **The join.** Add a card, add its role here |
| `LAYER_OF` | `index.html:907` | All 26 stage keys → layer id |
| `Q_VALUES` | `index.html:924` | Every legal value per question — the search space for counterfactuals |
| `A_LABEL` | `index.html:930` | Answer value → prose label ("a marketplace", "not technical") |
| `Q_RANK` | `index.html:941` | Question priority when choosing which counterfactual to report; used at `:975` |
| `ID_LABEL` | `index.html:942` | Tool id → display label, built from `STAGES`, then overridden at `:945–946` for prose |

`grow` (how people find you) and `safe` (how you stay out of trouble) are the two layers
added in `3a1f721` — the founder-facing, post-launch half the registry was missing.

- **Depends on:** Engine core (`STAGES`).
- **Depended on by:** Recommendation engine, Counterfactuals, Results rendering.

---

## 4. Counterfactuals

**Root:** `index.html:948–991`

| Symbol | file:line | Purpose |
|---|---|---|
| `joinOr(list)` | `index.html:948` | "a, b or c" |
| `counterfactual(a,stage)` | `index.html:955` | "Because you said **cost**. Had you said **scale**, this would be **Vercel**." Returns `""` when nothing would change the pick |

Computed, never written: every answer is flipped through its other values `:963`, `decide()`
re-runs `:964`, and anything that moves the pick is reported. It cannot drift from the rules
because it *is* the rules asked backwards.

- **Depends on:** Engine core (`decide`), Layers and labels (`Q_VALUES`, `A_LABEL`, `Q_RANK`, `ID_LABEL`).
- **Depended on by:** Recommendation engine — `mod()` attaches `cf` to every card.

---

## 5. Recommendation engine

**Root:** `index.html:993–1369`

The deterministic prose layer on top of `decide()`. **Extend this to sharpen advice.**

| Symbol | file:line | Purpose |
|---|---|---|
| `recommend(a, idea)` | `index.html:993` | Verdict, sub, approach, cards, cost, plan, tips, coherence, graph shape |
| `mod(role,name,why,badge,chosenId,extraAlts)` | `index.html:1038` | Local — pushes one stack card, resolving stage, layer, alts and counterfactual |
| `line(label,lo,hi)` | `index.html:1289` | Local — accumulates the honest monthly cost from the picks actually made |

Internal order: verdict `:997–1030` → cards `:1046–1256` → plan `:1258–1286` →
cost `:1287–1306` → tips `:1308–1331` → coherence `:1332–1357` → graph shape `:1359`.

**The 27 `mod()` call sites** (a median result renders ~18 cards, ~12 badged `core`):
`Build with` `:1046`, `Code home` `:1056`, `Site` `:1059`, `The app itself` `:1062`,
`Frontend host` `:1065`, `Engine host` `:1073`, `Backend` `:1079`, `Data + accounts`
`:1085`/`:1094`, `AI` `:1100`, `Payments` `:1110`/`:1114`/`:1119`, `Email` `:1128`/`:1132`,
`See usage` `:1138`/`:1145`, `Files` `:1151`, `Search` `:1159`, `Your keys` `:1167`,
`Where the words live` `:1175`, `Joining things up` `:1183`, `Talking to users` `:1191`,
`Staying in touch` `:1199`, `Forms` `:1206`, `The legal bits` `:1214`,
`Knowing it's down` `:1221`, `If it all goes wrong` `:1226`, `Deep errors` `:1232`,
`Real-time` `:1237`, `Job queue` `:1246`, `Domain + DNS` `:1253`.

**Returns:** `{verdict, sub, approach, mods[], plan[], tips[], costLabel, costCap,
costLines[], graph:{active,chosen}, profile, coherence}`, where a `mod` is
`{role, pick, why, badge, alts, stage, layer, cf}` and `coherence` is
`{total, light, band, over, now, later, headline, body, split}`.

- **Depends on:** Engine core, Tool registry, Layers and labels, Counterfactuals.
- **Depended on by:** Results rendering (`showResult`), AI enhancement, session capture.

---

## 6. Canvas and graph state

**Root:** `index.html:382–399` (layout) and `index.html:1374–1503` (targets + render)

| Symbol | file:line | Purpose |
|---|---|---|
| `NODES` / `LINKS` / `CENTER` / `clarity` | `index.html:382` | Canvas state. `clarity` 0→1 drives the untangling |
| `mulberry32(a)` | `index.html:383` | Seeded PRNG — the tangle is identical every load (seed `20260902`) |
| `layout()` (IIFE) | `index.html:384` | Precomputes polar positions + co-prime cross-links, so it is a real tangle rather than a tidy ring |
| `graphTargets(a, finalG)` | `index.html:1374` | answers → `{chosen, active, decided}` per **canvas** stage. With `finalG`, everything is decided |
| `applyTargets(tg)` | `index.html:1399` | Node roles (`pending`/`chosen`/`pruned`), link visibility, `clarity = decided/16`, progress bar; kicks `animate()` |
| `css(v)` / `hex(v)` | `index.html:1424`, `:1445` | Read live CSS custom properties so the canvas follows the theme |
| `resize()` | `index.html:1425` | DPR-aware canvas sizing |
| `animate()` / `tick(now)` | `index.html:1433`, `:1434` | rAF loop; collapses to one settled frame when `reduce` is set |
| `draw(now)` | `index.html:1446` | Menace vignette → cross-links → spokes → nodes → the "YOU" centre |

- **Depends on:** Engine core (`STAGES`, `decide`).
- **Depended on by:** UI wiring (every answer click), Results rendering (`showResult`).

---

## 7. UI wiring and share encoding

**Root:** `index.html:1506–1594`

| Symbol | file:line | Purpose |
|---|---|---|
| option-group click handler | `index.html:1509` | Delegated per `.opts[data-q]` — writes `answers`, updates the count, re-runs the canvas |
| `updateCaption(n)` | `index.html:1521` | The figure caption. **Counts are hardcoded and stale** — see CONVENTIONS gotcha 13 |
| `CODE` / `CODE_ORDER` / `DECODE` | `index.html:1530`, `:1540`, `:1541` | One-char-per-answer codec for the `?p=` link |
| `encodeAnswers(a)` / `decodeAnswers(code)` | `index.html:1543`, `:1544` | The codec itself |
| `shareURL(a,idea)` | `index.html:1550` | `?p=<code>&i=<idea>`, idea truncated to 200 chars |
| `summaryText(r,url)` | `index.html:1555` | Plain-text stack summary for "Copy summary" |
| `copyText(text,btn)` | `index.html:1561` | Clipboard with a hidden-textarea fallback and a "Copied ✓" state |
| `restoreAnswersUI()` | `index.html:1574` | Paints `aria-pressed` back onto the buttons after a shared load |
| `initFromURL()` | `index.html:1583` | `?r=` → `loadShared`; `?p=` → decode + `showResult(true)` |

- **Depends on:** Engine core, Canvas/graph, Results rendering.
- **Depended on by:** the init block at `index.html:2022–2023`.

---

## 8. Results rendering

**Root:** `index.html:1595–1720`

| Symbol | file:line | Purpose |
|---|---|---|
| `showResult(isShared)` | `index.html:1595` | Runs `recommend`, settles the canvas, swaps the headline, calls `renderResults` |
| form submit handler | `index.html:1607` | Guards on 8/8 answered, then `showResult(false)` |
| `renderResults(r,isShared)` | `index.html:1613` | Builds the whole result DOM as an HTML string and wires its buttons |
| `badge(b)` / `esc(s)` / `cardHtml(m)` | `index.html:1614`, `:1615`, `:1618` | Locals — badge markup, HTML escaping, one stack card |
| `layersHtml` / `coherenceHtml` | `index.html:1625`, `:1634` | The 9 layer groups; the weight/now-later panel |

Rendered sections in order: shared banner → verdict → `#airead` → layers → coherence →
"what makes it yours" → cost → plan → tips → `#spinkit` → map opt-in → share → actions.
Tail calls: `renderSpinKit(r)` `:1702` (guarded), `enhanceWithAI(r)` `:1703`,
`captureSession(r)` `:1716` (guarded, skipped when shared).

- **Depends on:** all of modules 1–6, plus Enhancements.
- **Depended on by:** UI wiring, `loadShared`.

---

## 9. Enhancements — AI, capture, spin-up, modals, short links

**Root:** `index.html:1722–2023`. Every symbol here degrades to a no-op.

| Symbol | file:line | Purpose |
|---|---|---|
| `AI_ON` / `CAPTURE_ON` / `SID` | `index.html:1722`, `:1723`, `:1724` | Feature flags flipped off by a 404/501; per-run session id |
| `newSid()` | `index.html:1725` | `crypto.randomUUID()` with a timestamp fallback |
| `captureSession(r)` | `index.html:1726` | Phase-1 POST to `/api/capture`; hides the map card if the function is absent |
| `escHtml` / `escAttr` / `mdBold` | `index.html:1738`, `:1739`, `:1740` | Escaping, plus minimal `**bold**` rendering for model output |
| `api(path,payload)` | `index.html:1741` | The single fetch wrapper. 404/501 → `Error{code:"off"}` |
| `ideaEl` + input handler | `index.html:1750`, `:1751` | Shows the tailor button once the idea is ≥12 chars |
| tailor click handler | `index.html:1756` | `stage:"followups"` → `renderFollowups` |
| `renderFollowups(d)` | `index.html:1770` | Injects up to 2 AI question cards into `#followups`; answers land in `aiFollow` |
| `enhanceWithAI(r)` | `index.html:1792` | `stage:"insights"` → idea-specific read into `#airead` |
| `stepHtml(s,i)` | `index.html:1808` | One provisioning step row |
| `renderSpinKit(r)` | `index.html:1811` | Ordered provisioning links, generated `.env`, Deploy-to-Vercel URL. **Re-reads `decide()` at `:1813`, never its own rules** |
| `onBrief(r,btn)` | `index.html:1945` | `stage:"brief"` → build brief in a modal |
| `openCompare(stage)` | `index.html:1959` | Full comparison table for a stage, straight from `TOOLS`/`COMPETES`; re-reads `decide()` at `:1961` |
| `openModal(title,sub,body)` | `index.html:1991` | Generic copyable-text modal |
| `shortLink(btn)` | `index.html:2003` | POST `/api/share` → `?r=` link, falling back to the long `?p=` |
| `loadShared(id)` | `index.html:2012` | GET `/api/share?id=` → restore answers → `showResult(true)` |

- **Depends on:** Engine core, Tool registry, Recommendation engine, `api/*`.
- **Depended on by:** Results rendering.

---

## 10. `api/tailor.js` — AI layer

**Root:** `api/tailor.js` (200 lines, CommonJS). Unchanged since the first index.

| Symbol | file:line | Purpose |
|---|---|---|
| `handler(req,res)` | `api/tailor.js:163` | Default export. POST only; 501 with no key, 400 with no idea, 502 on model/parse failure |
| `geminiKey()` / `groqKey()` | `api/tailor.js:14`, `:15` | Env read **at call time** |
| `pickProvider()` | `api/tailor.js:17` | `AI_PROVIDER` forces; otherwise Gemini > Groq; `null` if neither |
| `VOICE` | `api/tailor.js:28` | The system prompt: plain, honest, JSON-only, never upsell |
| `readBody(req)` | `api/tailor.js:34` | Manual body read, capped at 1 MB |
| `extractJSON(text)` | `api/tailor.js:44` | Strips fences, falls back to first `{` … last `}` |
| `ANSWER_LABELS` / `answerSummary(a)` | `api/tailor.js:53`, `:57` | Answers → a compact prompt line |
| `buildPrompt(body)` | `api/tailor.js:65` | The 3 stages: `followups` (400 tok), `insights` (500), `brief` (950) |
| `callGroq(spec)` / `callGemini(spec)` | `api/tailor.js:116`, `:137` | Provider callers; each returns `{text}` or `{error,status}` |
| `module.exports._internals` | `api/tailor.js:198` | Test-only surface. Not used by the running function |

- **Depends on:** global `fetch` (Node 18+) and env. No npm imports.
- **Depended on by:** `index.html` (`api()` → `/api/tailor`), `test/tailor.test.js`.

---

## 11. `api/share.js` — short links

**Root:** `api/share.js` (89 lines, CommonJS)

| Symbol | file:line | Purpose |
|---|---|---|
| default export | `api/share.js:58` | GET `?id=` → `{answers, idea}` (cached 24 h); POST → `{id}`; else 405 |
| `connString()` | `api/share.js:14` | `DATABASE_URL` and its three aliases |
| `VALID` | `api/share.js:19` | Whitelist of the 8 answers — **duplicated at `api/capture.js:29`** |
| `readBody(req)` | `api/share.js:30` | Capped at 100 KB |
| `cleanAnswers(a)` | `api/share.js:40` | All-or-nothing: any bad value rejects the whole payload |
| `shortId()` | `api/share.js:50` | 6 chars from an unambiguous 32-char alphabet |

- **Depends on:** `@neondatabase/serverless`, `crypto`, table `public.stacks`.
- **Depended on by:** `index.html` (`shortLink`, `loadShared`).

---

## 12. `api/capture.js` — session capture (the data moat)

**Root:** `api/capture.js` (128 lines, CommonJS)

| Symbol | file:line | Purpose |
|---|---|---|
| default export | `api/capture.js:80` | POST only. Phase 2 (email) at `:95`, phase 1 (anonymous) at `:109`. Both upsert on `sid` |
| `connString()` | `api/capture.js:24` | Same four env aliases |
| `VALID` | `api/capture.js:29` | The duplicated whitelist |
| `readBody(req)` | `api/capture.js:40` | Capped at 200 KB |
| `cleanAnswers(a)` | `api/capture.js:50` | As in share.js |
| `cleanStack(s)` | `api/capture.js:61` | `[{role,pick}]`, capped at 24 and truncated — the sellable signal |
| `validSid` / `newSid` / `validEmail` | `api/capture.js:69`, `:73`, `:75` | Guards; email requires `consent === true` |

⚠ **`cleanStack` caps the stack at 24 entries** `api/capture.js:63`, and a sweep of all
2592 answer combinations puts the maximum at **exactly 24** cards (`content` + logins + pay
now + heavy + AI + real-time + nontech + scale; mean 17.7). Nothing is truncated today, and
there is **zero headroom** — the next `mod()` call added to `recommend()` silently drops
cards from the capture table for the heaviest profiles. Raise the cap when you add a card.

Privacy is enforced in code, not policy: no IP, no cookies, no fingerprint; `email` lives in
its own column and never enters the aggregate.

- **Depends on:** `@neondatabase/serverless`, `crypto`, table `public.sessions`.
- **Depended on by:** `index.html` (`captureSession`, the map opt-in form), `test/capture.test.js`.

---

## 13. `db/` — schema and the aggregate

| File | Purpose |
|---|---|
| `db/schema.sql:10` | `public.stacks (id, answers jsonb, idea, created_at)` |
| `db/schema.sql:20` | `public.sessions (id, answers, stack, verdict, approach, idea, source, email, consent, email_at, created_at)` plus two indexes at `:34` and `:35` |
| `db/insights.sql` | 8 aggregate queries. #3 (`db/insights.sql:24`) is tool share — "the number a vendor pays for" |

Already applied to the live Neon project. No migration tooling exists.

---

## 14. `test/`

| File | Covers |
|---|---|
| `test/tailor.test.js` | `extractJSON`, `answerSummary`, `buildPrompt`, `pickProvider`, and the 405/501/400 HTTP guards. 3 LIVE tests gated on `RUN_LIVE=1` |
| `test/capture.test.js` | 501/405/400 guards — everything that returns before a DB call |

Both hand-roll a `mockRes()` and save/restore env around each case. **`api/share.js` and all
of `index.html` have no automated tests** — the 2592-combination sweep quoted in commit
`3a1f721` was run ad hoc, not committed.

---

## Adjacency summary

```
UI wiring          -> Engine core, Canvas/graph, Results rendering
Engine core        -> (nothing)
Tool registry      -> Engine core
Layers and labels  -> Engine core
Counterfactuals    -> Engine core, Layers and labels
Recommendation     -> Engine core, Tool registry, Layers and labels, Counterfactuals
Canvas/graph       -> Engine core
Results rendering  -> Recommendation, Layers and labels, Tool registry, Canvas/graph, Enhancements
Enhancements       -> Engine core, Tool registry, Recommendation, api/tailor, api/share, api/capture
api/tailor.js      -> fetch, env
api/share.js       -> @neondatabase/serverless, crypto, db.stacks
api/capture.js     -> @neondatabase/serverless, crypto, db.sessions
test/*             -> api/tailor.js, api/capture.js
```
