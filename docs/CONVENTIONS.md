# CONVENTIONS.md - house rules, patterns, and footguns

Inferred from the code as it actually is, not from ideals. Indexed 2026-09-04 against
`index.html` @ 2024 lines, md5 `33c3da71…` (commit `3a1f721`). Companion to
[../CLAUDE.md](../CLAUDE.md) and [MODULE_MAP.md](MODULE_MAP.md).

> **Stale as of 2026-09-05:** `index.html` has changed since that index and is now
> **2431 lines**, md5 `9be0986189623d2fb7bbe28c575d0f17`. The structure, the registries and
> the reasoning below still hold; every `file:line` in this document is approximate.
> `grep -n` to confirm a location before editing.

## Language and style

**Frontend (`index.html`)** is deliberately old-school and must stay that way - it runs from
`file://` with no build step:

- `var`, not `let`/`const`. `function(){}`, not arrow functions. No classes, no modules,
  no `async`/`await` - promises use `.then()/.catch()`.
- **Two exceptions already in the code:** `fetch` and `crypto.randomUUID()` (with a
  fallback). Don't add more without a fallback.
- Everything is a global in one `<script>` block. There is no namespace object - a new
  top-level `var` is a new global. Check for a name collision before adding one.
- Compact formatting: multiple statements per line, minimal whitespace. Match the density of
  the surrounding lines.
- `$(sel)` `index.html:356` is the only DOM helper. `document.querySelector` directly is used
  only where a second argument or `querySelectorAll` is needed.

**Backend (`api/*.js`)** is Node CommonJS with no framework:

- `module.exports = handler` (or `module.exports = async (req,res) =>`). No `export default`.
- No npm imports except `@neondatabase/serverless` and Node's own `crypto`.
- **Env is read inside a function, never at module scope** (`connString()`, `geminiKey()`) so
  tests can swap it per case. Never hoist an env read to the top of a file.

## Structural patterns

- **One source of truth.** `decide()` decides; nothing else may re-derive a pick. If you need
  a pick anywhere new, call `decide(answers)` and read from it - `renderSpinKit`
  `index.html:1813` and `openCompare` `:1961` both do exactly this.
- **Two registries, on purpose.** `STAGES` (16) is the **canvas**; `COMPETES` (26) is the
  full decision set. Adding a decision usually means `COMPETES` + `decide()` + `LAYER_OF` +
  `ROLE2STAGE` + a `mod()` call - and *not* `STAGES`.
- **Facts vs judgement are separated** in every `TOOLS` entry. Facts (`what`, `cost`,
  `lockin`) carry a `checked` date; judgement (`against`) is keyed by goal with `any` as the
  fallback. Never write a why-not line into a card - put it in the registry so it appears
  everywhere that tool competes.
- **Registry-driven UI.** Adding a tool = an entry in `TOOLS` + its id in `COMPETES`. It then
  shows up in the compare table and every "options it beat" list automatically.
- **Scope is defended in the registry.** Kubernetes, service meshes, Terraform, Kafka,
  Prometheus, data warehouses and CI beyond push-to-deploy are **deliberately absent**.
  Anyone who needs them has a platform team; that material is the exact thing the weight
  model exists to keep out. Adding one is a positioning change, not a data change.
- **HTML is built as strings and assigned to `innerHTML`,** not constructed via DOM APIs.
  The one exception is `renderFollowups` `:1770`, which uses `createElement` because it
  appends repeatedly. Everything interpolated must pass through an escaper.
- **Data tables over conditionals** for labels: `A_LABEL`, `ID_LABEL`, `LAYER_OF`,
  `ROLE2STAGE`, `CODE`. Prefer extending a map to adding an `if`.
- **Comments carry the *why*, at length.** The block comments above `decide()`, `TOOLS`,
  `carryBand`, `LAYERS` and `counterfactual` are design rationale, not description. Preserve
  them when editing nearby; if you change the reasoning, update the comment in the same edit.

## Error handling

**Server** - every handler is one `try/catch` returning JSON, never a thrown error:

| Status | Meaning | Example |
|---|---|---|
| 400 | Bad input, rejected before any I/O | `missing_idea`, `invalid_answers`, `consent_required` |
| 404 | Row not found | `api/share.js:69` |
| 405 | Wrong method - **always set `Allow` first** | `api/tailor.js:165` |
| 501 | Feature not configured (no key / no DB) | `api/tailor.js:170`, `api/share.js:60` |
| 502 | Upstream failed | `model_error`, `unparseable`, `fetch_failed`, `db_error` |

`detail` is always truncated (`.slice(0, 200–400)`) so an upstream error can't leak a wall of
text. Validation is **all-or-nothing**: one bad answer value rejects the whole payload.

**Client** - the contract is *degrade invisibly*:

- Route everything through `api()` `index.html:1741`. It turns 404/501 into
  `Error{code:"off"}`; the caller then latches its feature flag off and hides the control.
- Wrap enhancements at the call site: `try{ renderSpinKit(r); }catch(e){}` `:1702`,
  `try{ captureSession(r); }catch(e){}` `:1716`. A broken enhancement must never take the
  deterministic result down with it.
- Network failures fall back to something that still works - short link → long link,
  clipboard API → hidden textarea, shared-link load → empty canvas.

**Logging:** there is none, client or server. Don't add `console.log` to shipped code.

## Escaping (the security-relevant convention)

Three escapers exist and they are not interchangeable by intent:

| Function | Location | Use for |
|---|---|---|
| `esc(s)` | `index.html:1615` | Inside `renderResults` only |
| `escHtml(s)` | `index.html:1738` | AI/model output and spin-up text |
| `escAttr(s)` | `index.html:1739` | Attribute values (currently delegates to `escHtml`) |

All escape `& < > "`. **Model output and user text must always pass through one of them.**
`mdBold` `:1740` deliberately re-introduces `<b>` tags - it must only ever be applied *after*
`escHtml`, as at `:1799`. Engine-authored prose (verdicts, tips, plan steps, counterfactuals)
contains intentional `<b>` markup and is inserted unescaped; that is why those strings are
literals in `recommend()` and must never be built from user input.

## Testing

- **Framework:** Node's built-in `node:test` + `node:assert/strict`. Zero test dependencies.
- **Location:** `test/`, named `<module>.test.js`.
- **Run all:** `npm test`. **Run one:** `node --test test/capture.test.js`.
- **Live tests** are gated on `RUN_LIVE=1` plus a real key and use `{ skip: !LIVE }`, so the
  default run never touches the network. `npm run test:live` uses POSIX env-prefix syntax and
  will not work in PowerShell - set the vars separately there.
- **Pattern:** every suite hand-rolls a `mockRes()` (chainable `status().json()`, plus
  `setHeader`) and calls the exported handler directly - no server, no supertest. Env is
  saved and restored around each case (`withEnv` in `test/tailor.test.js:36`).
- **Coverage gaps:** `api/share.js` has no tests, and **none of `index.html` is tested** - no
  `decide()`, no `recommend()`, no rendering.
- **Sweeping the engine without a browser** is the only automated check that covers
  `index.html`. Run it after any change to `decide()`, `recommend()`, `TOOLS`, `COMPETES`,
  `ROLE2STAGE` or `LAYER_OF`:

  ```bash
  npm run sweep          # or: node scripts/sweep.js
  ```

  It extracts the DOM-free region of `index.html` between the `SWEEP-START` and `SWEEP-END`
  marker comments, runs `recommend()` over every legal answer combination in a Node VM with
  no DOM, and **exits non-zero if a gate fails**. It gates rather than reports, on purpose.

  Gates: every card has at least one alternative; every card's role resolves through
  `ROLE2STAGE` to a layer in `LAYER_OF`; the maximum card count fits the capture cap read
  live from `api/capture.js`; the mean "Start here" count stays under 12.5; every `TOOLS`
  entry appears in a `COMPETES` list and vice versa; every entry has a `checked` stamp and
  an `against.any` fallback.

  Verified numbers, recomputed 2026-09-07: **2592 combinations, mean 17.70 cards, min 8,
  max 24, mean 11.97 badged "now", max 16, zero cards missing an alternative or a layer.**
  It also prints the goal-specific `against` coverage as a tracked report, not a gate.

  An earlier version of this recipe sliced the file by absolute line numbers
  (`sed -n '356,1369p'`) and silently broke when the file grew. Do not reintroduce a line
  number here - the markers are the contract.

## Not to be hand-edited / regenerated

- `package-lock.json` - regenerated by `npm install`.
- `node_modules/` - gitignored.
- Nothing else is generated. There is no codegen, no bundler, no minifier, and `index.html`
  is genuinely hand-written despite its size.
- `db/schema.sql` is hand-written but **already applied to the live Neon database**. Editing
  it changes nothing in production; you must also run the change in the Neon SQL Editor.

## Gotchas and footguns

1. **`index.html` line numbers drift constantly.** It is one file under continuous edit - it
   changed three times during the first indexing pass and grew 1850 → 2024 between passes.
   Always `grep -n` before editing at a line number.
2. **`VALID` is duplicated** in `api/share.js:19` and `api/capture.js:29`, and the frontend
   `CODE` map `index.html:1530` is a third copy of the same value space. A new question or
   option value must be added to all three or shared links and capture start 400-ing.
3. **`needs` is the trigger, not the dependency set** (`decide()` `index.html:453`). It
   controls when a stage *settles on the canvas*, not when the pick is final. Widening it to
   the true dependency set is technically more correct and ruins the untangling.
4. **`STAGES` ≠ the decision set.** 16 canvas stages, 26 decisions, 24 picks. Adding a stage
   to `STAGES` adds a tentacle to the tangle; that is usually **not** what you want, because
   the canvas only labels chosen nodes and extra tentacles crowd it without adding feeling.
5. **A card standing for several tools must pass an array** as `chosenId`, e.g.
   `mod("Site","Framer or Webflow",…,["framer","webflow"])`. Pass a string and the card lists
   its own other half among the options it beat.
6. **A `mod()` role missing from `ROLE2STAGE`** silently gets `stage:""`, falls into the
   `build` layer, and loses its counterfactual and compare button. No error is thrown.
7. **"Start here" must mean the minimum that gets you live.** With 26 stages it is easy to
   badge everything `core` and produce a wall of "Start here" cards - the exact upsell this
   product refuses. Current sweep: mean 12.0 "now" cards, max 16. If the mean creeps much
   past ~12, demote something to `later`.
8. **`cleanStack` caps the captured stack at 24** `api/capture.js:63`, and the verified
   maximum result is **exactly 24 cards**. Zero headroom: the next `mod()` you add starts
   silently truncating the data moat for the heaviest profiles. Raise the cap in the same
   commit that adds the card.
9. **`counterfactual()` re-enters `decide()` ~20 times per card**, so a single result runs
   `decide` around 350 times. `decide` must stay pure and cheap - no fetches, no DOM reads.
10. **`renderResults` re-binds a click listener on `#results` every call**
    `index.html:1690`. Harmless while it renders once per page; adding a re-render path
    (live preview, "apply this change") will stack duplicate handlers.
11. **`TOOLS` costs go stale.** `CHECKED` is `"2026-09"` across all 83 entries. In a product
    whose promise is an honest cost, a stale price is a broken promise - re-check anything
    older than ~6 months and keep costs as shapes, not exact cents.
12. **The canvas seed is fixed** (`mulberry32(20260902)`, `index.html:384`). The tangle is
    identical on every load by design. Changing the seed changes the product's signature image.
13. **The figure-caption counts are derived, and must stay derived.** They used to be
    string literals ("34 options across 13 decisions") and drifted out of date as stages were
    added. `updateCaption()` now reads `NODES.length` and `STAGES.length` directly, so adding
    a tool or a canvas stage updates the caption by itself. Never reintroduce a literal there
    - a stale count in a product that promises an honest number is the same broken promise as
    a stale price.
14. **Any new answer key must be added in five frontend places:** `answers` `:358`,
    `REQUIRED` `:359`, a `.opts[data-q]` block in the HTML, `CODE`/`CODE_ORDER` `:1530`, and
    `Q_VALUES`/`A_LABEL` `:924`/`:930` - plus the two backend `VALID` maps. Miss `Q_VALUES`
    and counterfactuals silently stop considering that question.
15. **`draw()` reads CSS custom properties every frame** via `css()`/`hex()`. That is what
    makes the canvas theme-aware - don't hardcode a hex value in the canvas code.
16. **Never export `sessions.email` or `sessions.idea`** into anything published, sold, or
    handed to a vendor. `db/insights.sql` is written to make the safe query the easy one.
17. **`vercel dev` is the only way to exercise `/api` locally**, and it is not an npm script.
    Opening `index.html` directly is the normal frontend workflow - the API calls 404 and the
    site degrades exactly as it should.
