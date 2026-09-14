# Agent Workflow Plan - groundwork
Branch: claude/lucid-goldberg-1v42fo | Pushed: yes | Date: 2026-09-14 | Commit: e65b33b
SECTIONS DONE: 0, 1, 2, 3, 4, 5, 5b   SECTIONS OPEN: 6 (needs approval), 7 (re-measure 2026-09-28)
NEXT: approve or amend Tier 1 below, then run `/audit continue` in this session.

This run re-derived every number from scratch rather than inheriting the previous plan's
evidence, and it corrects one figure that plan got wrong (see T1-2, "Start here" mean).

The §5b reviewer pass ran twice. The first attempt died on an API rate limit and is not
counted. The second confirmed the mechanism end to end - it rebuilt both scripts from the
text pasted below, inserted the markers exactly as T1-1 specifies, and reproduced every
number claimed here - and returned two blocking findings against this document, both
verified and fixed before this version: the reference count in "Biggest constraint" was 15
and is actually 19 (it had missed `CLAUDE.md:46`), and Flag 3 cited two lines that contain
an ellipsis rather than an em dash while missing all 31 real ones. Two optional findings
were also fixed rather than noted: a line number that had crept into a script comment, and
a parser that rejected an ordinary `//` comment.

## Current state

Solo repo: 38 tracked files, 40 commits, one runtime dependency, no CI and no `.github/`
at all. The product is one 2431-line `index.html` plus three CommonJS serverless
functions. Agent config is already mature - CLAUDE.md (271 lines), 7 skills, 2 commands,
a review subagent, a SessionStart hook, and a permission allowlist with real deny rules.
Most standard recommendations are already in place and are rejected below, not repeated.

The gap is not missing scaffolding. It is that the scaffolding points at a check that
does not run, and at current-state facts nothing verifies.

## Biggest constraint

**The only check covering the product's core logic cannot be executed, and 15 places in
the repo still instruct an agent to execute it.**

Evidence, all re-run today against `e65b33b`:

- `docs/CONVENTIONS.md:122` extracts the engine with `sed -n '356,1369p' index.html`.
  Line 356 is `<div class="herogrid">`; line 1369 is a `plan.push(...)` line. Running the
  recipe verbatim gives `SyntaxError: Unexpected token '<'`. Exit non-zero, no sweep.
- The `<script>` block actually opens at `index.html:456` and the DOM-free region ends at
  `index.html:1541` (canvas rendering starts at 1542, first `document.` use at 1544).
  The file grew 2024 -> 2431 lines since the recipe was written.
- **19 references across 11 files** point at it. Recounted exhaustively with
  `grep -rn 'sweep\|Sweep\|356,1369' --include=*.md`: `APPLY.md:59`, `APPLY.md:82`,
  **`CLAUDE.md:46`**, `CLAUDE.md:190`, `CLAUDE.md:247`, `CONTEXT.md:50`, `CONTEXT.md:67`,
  `docs/CONVENTIONS.md:118`, `docs/CONVENTIONS.md:122`, `docs/CONVENTIONS.md:159`,
  `docs/MODULE_MAP.md:303`, `docs/MODULE_MAP.md:337`,
  `.claude/skills/engine-change/SKILL.md:43`, `.claude/skills/engine-change/SKILL.md:82`,
  `.claude/skills/add-a-tool/SKILL.md:61`, `.claude/skills/edit-index-html/SKILL.md:53`,
  `.claude/skills/run-tests/SKILL.md:36`, `.claude/skills/data-contracts/SKILL.md:48`,
  `.claude/commands/done-check.md:6`. **10 are imperative** - they tell an agent to run the
  thing. **9 quote its output as fact.** Both kinds are wrong today.
  `CLAUDE.md:46` is the one that matters most and the one an earlier draft of this plan
  missed: it sits in the "How to run" section, the part of CLAUDE.md every session reads,
  and it is a bare imperative - "Sweep the engine headlessly after any
  `decide()`/`recommend()` change - see the recipe in `docs/CONVENTIONS.md` (Testing)".
- `npm test` is green - 12 pass, 3 skip, exit 0, **0.57 s real** - and covers
  `api/tailor.js` and `api/capture.js` only. `api/share.js` and all 2431 lines of
  `index.html` have zero automated coverage.
- Second-order: `CLAUDE.md:113` states the current `index.html` md5 is `2b5e2083...`.
  It is **`9be09861...`**. The note whose job is to say how stale the docs are is itself
  stale, because nothing derives it.

This is audit rule 7. The repo mandates a check its own environment cannot perform, so
every agent that reads the instruction silently reinterprets it as "skip the sweep". A
repo that auto-deploys to production on push, whose core logic has no runnable check, is
one bad `decide()` edit away from shipping a wrong recommendation to every visitor.

## §2 Classify

| Signal | Value | Evidence |
|---|---|---|
| Project kind | app (static frontend + serverless functions) | `index.html`, `api/*.js`, `vercel.json` |
| Verification | tests only, covering ~15% of the product | `package.json` `"test": "node --test"`; no `.github/workflows/`; `docs/CONVENTIONS.md:116` "none of `index.html` is tested" |
| Does it pass today? | `npm test` exit **0**, 0.57 s real, 12 pass / 3 skip. The engine sweep exits **non-zero with `SyntaxError`** - correct result today, and the finding | run of `npm test`; run of the `docs/CONVENTIONS.md:122` recipe |
| File count | <100 (38 tracked) | `git ls-files \| wc -l` |
| Type system | dynamic, deliberately ES5-style | `index.html` uses `var`/`function`; `.claude/agents/code-reviewer.md` flags `let`/`const`/arrow as drift |
| Task shape | few deep interdependent changes in one file | 12 of the last 200 file-touches are `index.html`, a single 2431-line file |
| Repetition | none reaches 3 | top repeated commit subject prefix is 2 ("Phase 3: three skills...", "Add files via upload") |
| Who commits | 24 `simonskok`, 10 `Claude`, 6 `simonskok1-source` (40 total) | `git log --format='%an' -300` |
| External systems | Neon Postgres, Vercel deploy, Gemini/Groq APIs | `.env.example`, `api/*.js`, `HANDOFF.md` |
| Team size | solo | one human author identity |
| Failure cost | prod-facing, not regulated - push to `main` deploys production | CLAUDE.md "Branching: there isn't any"; `vercel.json` |
| Existing config | CLAUDE.md + 7 skills + 2 commands + 1 subagent + SessionStart hook + permissions | `.claude/` listing |
| CLAUDE.md size | **271 lines** - over the ~200 flag, and the single highest-churn file in the repo (16 of the last 200 touches) | `wc -l CLAUDE.md`; `git log --name-only` |

## §3 Triggers that fired

| Trigger | Fired? | Mechanism |
|---|---|---|
| Verification = none, or exits non-zero for environmental reasons | **yes** - for `index.html`, the product | T1-1, T1-2 |
| Non-obvious quirks belong in CLAUDE.md | **yes, inverted** - CLAUDE.md carries quirks that are now wrong | T1-3 |
| Verification passes, unattended runs wanted | not yet - no unattended run has been attempted | Tier 2 |
| Human commits bypass agent gates | not yet - the check does not exist to bypass | Tier 3 |
| Repeated commit subjects >= 3 | **no** - max 2, and 7 skills already exist | Rejected |
| File count > 1k | **no** - 38 | Rejected |
| Prod-facing | yes - **already satisfied** by `.claude/agents/code-reviewer.md` | no new work |
| Many small independent edits | **no** - one file, interdependent | Rejected |
| Typed language | **no** - deliberately dynamic ES5 | Rejected |
| Many contributors | **no** - solo | Rejected |

## Tier 1 - do now

Three commits, in order. Each is a precondition of the next.

### T1-1. Make the engine loadable from Node

**Artifact** `scripts/engine.js`, plus two comment markers in `index.html`.

**Why** The §2 "Verification" row: the product's core logic has no runnable check because
the only documented way to reach it is a line-number `sed` that no longer points at code.
Rule 1 - the check comes before anything else. Anchoring on markers rather than line
numbers is what stops this breaking again in a file CLAUDE.md itself says drifts
constantly; it is the same reasoning as the repo's own "figure-caption counts are derived,
never typed" rule.

**Correction made during implementation:** this section originally called the marked span
"the DOM-free region". It is not. `$` (the line right after `ENGINE:START`) and the last
line of `graphTargets()` both reach for `document`, and neither is called by the sweep, so
the region loads cleanly today and would not tomorrow if an export ever pulled rendering
code in. `engine.js` now ships a `document` tripwire that raises a named error instead of a
bare `ReferenceError`, and every claim here says "engine region", not "DOM-free".

**Content** Two lines added to `index.html`, no behaviour change (both are comments inside
the existing `<script>` block):

- `/* ENGINE:START */` immediately after `<script>` (currently line 456)
- `/* ENGINE:END */` immediately before `/* ---------- Canvas rendering ---- */`
  (currently line 1542; the first line that touches the DOM *at load* is 1544)

Then `scripts/engine.js`:

```js
// Load index.html's engine region as a Node module.
// Anchored on markers, never line numbers - index.html drifts constantly.
//
// The region is everything that computes: STAGES, TOOLS, COMPETES, decide(),
// recommend(), and graphTargets(). Two things in it reach for the DOM - the $
// helper and the last line of graphTargets() - but only when called, and the
// sweep calls neither, so loading the region has no side effects.
//
// Both shims below are deliberate. matchMedia runs at load time and must return
// something. document is a tripwire: nothing should reach it, so touching it
// raises a named error instead of a bare ReferenceError, which is what a future
// export that pulls DOM code into the sweep would otherwise produce.
var fs = require("fs");
var path = require("path");
var os = require("os");

var ROOT = path.join(__dirname, "..");
var SRC = path.join(ROOT, "index.html");
var START = "/* ENGINE:START */";
var END = "/* ENGINE:END */";

function slice() {
  var html = fs.readFileSync(SRC, "utf8");
  var a = html.indexOf(START), b = html.indexOf(END);
  if (a < 0 || b < 0 || b < a) {
    throw new Error(
      "index.html is missing the " + START + " / " + END + " markers.\n" +
      "The engine check is anchored on them. Restore both around the engine\n" +
      "region: START right after <script>, END right before the canvas rendering\n" +
      "block. Do not replace them with line numbers - the file drifts."
    );
  }
  return html.slice(a + START.length, b);
}

var EXPORTS = ["decide", "recommend", "Q_VALUES", "STAGES", "NODES",
               "TOOLS", "COMPETES", "ROLE2STAGE", "CHECKED", "LAYER_OF"];

var SHIMS = [
  "var window={matchMedia:function(){return{matches:false};}};",
  "var document={get documentElement(){return domReached();}," +
  "querySelector:function(){return domReached();}};",
  "function domReached(){throw new Error(" +
  "'engine.js: the engine region reached for the DOM. It is loaded outside a " +
  "browser, so it must stay computation-only. Either the export list now pulls " +
  "in rendering code, or rendering code moved above the ENGINE:END marker.');}"
].join("\n");

var cached = null;

function load() {
  if (cached) return cached;              // one temp dir per process, not per call
  var body = [
    SHIMS,
    slice(),
    "module.exports={" + EXPORTS.map(function (n) { return n + ":" + n; }).join(",") + "};"
  ].join("\n");
  var tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "gw-engine-")), "engine.js");
  fs.writeFileSync(tmp, body);
  cached = require(tmp);
  return cached;
}

module.exports = { load: load, slice: slice, ROOT: ROOT, SRC: SRC };
```

**Proof** `node -e "require('./scripts/engine.js').load()"` exits 0 and the loaded module
exposes `decide recommend Q_VALUES STAGES NODES TOOLS COMPETES ROLE2STAGE CHECKED LAYER_OF`.
Deleting either marker produces the named marker error, not a `SyntaxError`. Both were run
today against a marked copy of the current `index.html` before this plan was written.

**Not self-invalidating** Adding two lines shifts every `index.html` line number below 456
by one or two. Nothing in `scripts/engine.js` or `scripts/sweep.js` refers to an
`index.html` line number - that is the entire point of the markers. The stale `file:line`
references elsewhere in the repo are handled in T1-3, in the same session.

### T1-2. Turn the sweep into a gate with a real exit code

**Artifact** `scripts/sweep.js`, and `"verify": "node --test && node scripts/sweep.js"` in
`package.json`.

**Why** Rule 1 and rule 4. A check that only prints numbers is a report; this one asserts
and exits non-zero. Two of its assertions mechanically enforce frozen contracts that today
rely on a human remembering: the capture cap (contract 3) and the three-copy `VALID`
whitelist (contract 2). It reads the cap out of `cleanStack` in `api/capture.js` and the
answer space out of **all four** places that hold it - `Q_VALUES` and the share-link `CODE`
map in `index.html`, plus `VALID` in `api/share.js` and `api/capture.js` - so the copies
cannot drift apart in silence. Note the count: CLAUDE.md calls this "three copies", but
`CODE` (`index.html:1922`) is a fourth representation of the same value space, and it sits
*outside* the engine region, so the sweep reads it from the file text rather than through
`engine.load()`. A `CODE` drift silently corrupts `?p=` share links, which is why it is in. It never re-implements a pick: the now/later split is read from
`recommend().coherence.now`, the product's own value at `index.html:1446`, honouring the
"`decide()` is the single source of truth" non-negotiable.

**Content**

```js
// Headless sweep of the recommendation engine. Exit 0 green, exit 1 red.
// Covers what `npm test` cannot reach: decide()/recommend() inside index.html.
var fs = require("fs");
var path = require("path");
var engine = require("./engine.js");

var ROOT = engine.ROOT;
var E;
try { E = engine.load(); }
catch (e) { console.error("SWEEP FAILED\n  - " + e.message); process.exit(1); }

var fails = [], notes = [];
function fail(m) { fails.push(m); }

/* ---- the whole answer space, built from Q_VALUES ----------------------- */
var QV = E.Q_VALUES;
var all = [{}];
Object.keys(QV).forEach(function (k) {
  var next = [];
  all.forEach(function (o) {
    QV[k].forEach(function (v) { var c = Object.assign({}, o); c[k] = v; next.push(c); });
  });
  all = next;
});

/* ---- frozen contract 3: the capture cap, read from cleanStack ----------- */
var capSrc = fs.readFileSync(path.join(ROOT, "api", "capture.js"), "utf8");
var fn = capSrc.indexOf("function cleanStack");
var capM = fn < 0 ? null : capSrc.slice(fn, fn + 400).match(/\.slice\(0,\s*(\d+)\)/);
if (!capM) fail("api/capture.js: could not read the cleanStack cap. Contract 3 is unverifiable.");
var CAP = capM ? Number(capM[1]) : 0;

/* ---- frozen contract 2: the answer space, in all four places it lives ---- */
function shape(o) {
  return JSON.stringify(Object.keys(o).sort().map(function (k) {
    return [k, o[k].slice().sort()];
  }));
}
function readObject(src, decl) {
  var i = src.indexOf(decl);
  if (i < 0) return null;
  i = src.indexOf("{", i);                 // start at the brace, not past it
  var j = src.indexOf("\n};", i);
  if (i < 0 || j < 0) return null;
  try {
    return JSON.parse(src.slice(i, j + 2)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "")
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
      .replace(/'/g, '"')
      .replace(/,(\s*[}\]])/g, "$1"));
  } catch (e) { return null; }
}
// the two server whitelists
["share.js", "capture.js"].forEach(function (f) {
  var v = readObject(fs.readFileSync(path.join(ROOT, "api", f), "utf8"), "const VALID = {");
  if (!v) return fail("api/" + f + ": could not read the VALID whitelist. Contract 2 is unverifiable.");
  if (shape(v) !== shape(QV)) fail("VALID drift: api/" + f + " does not match Q_VALUES in index.html. Shared links and capture will 400 on valid answers.");
});
// the share-link CODE map. It lives OUTSIDE the marked engine region, so it
// is read from the file text rather than through engine.load(). Locate it with
// `grep -n "var CODE=" index.html` - no line number is recorded here on purpose.
var htmlSrc = fs.readFileSync(engine.SRC, "utf8");
var CODE = readObject(htmlSrc, "var CODE={");
if (!CODE) fail("index.html: could not read the CODE map. Contract 2 is unverifiable.");
else {
  var codeSpace = {};
  Object.keys(CODE).forEach(function (k) { codeSpace[k] = Object.keys(CODE[k]); });
  if (shape(codeSpace) !== shape(QV)) fail("VALID drift: the CODE map in index.html does not match Q_VALUES. Share links will drop or mis-encode an answer.");
  var letters = {};
  Object.keys(CODE).forEach(function (k) {
    var seen = {};
    Object.keys(CODE[k]).forEach(function (v) {
      if (seen[CODE[k][v]]) letters[k] = 1;
      seen[CODE[k][v]] = 1;
    });
  });
  var dup = Object.keys(letters);
  if (dup.length) fail("CODE map has duplicate letters within: " + dup.join(", ") + ". Two answers would decode to the same value.");
}

/* ---- the sweep --------------------------------------------------------- */
var n = all.length, total = 0, max = 0, nowTotal = 0, nowMax = 0;
var noAlt = 0, noLayer = 0, empty = 0, badRole = {}, threw = 0, firstErr = "";
all.forEach(function (a) {
  var r;
  try { r = E.recommend(a, ""); }
  catch (e) { threw++; if (!firstErr) firstErr = JSON.stringify(a) + " -> " + e.message; return; }
  var mods = (r && r.mods) || [];
  if (!mods.length) empty++;
  total += mods.length;
  if (mods.length > max) max = mods.length;
  var now = r.coherence ? r.coherence.now : 0;   // the product's own now/later split
  nowTotal += now;
  if (now > nowMax) nowMax = now;
  mods.forEach(function (m) {
    if (!m.alts || !m.alts.length) noAlt++;
    if (!m.layer) noLayer++;
    if (!Object.prototype.hasOwnProperty.call(E.ROLE2STAGE, m.role)) badRole[m.role] = 1;
  });
});
var meanCards = total / n, meanNow = nowTotal / n;

if (threw) fail(threw + " of " + n + " combinations threw. First: " + firstErr);
if (empty) fail(empty + " of " + n + " combinations produced no recommendation cards.");
if (noAlt) fail(noAlt + " cards carry no alternatives. Every pick must show the options it beat.");
if (noLayer) fail(noLayer + " cards carry no layer.");
var missing = Object.keys(badRole);
if (missing.length) fail("roles missing from ROLE2STAGE (they fall into 'build' and lose their counterfactual): " + missing.join(", "));
if (CAP && max > CAP) fail("max result is " + max + " cards but api/capture.js caps at " + CAP + ". Raise the cap in the same commit.");
if (CAP && max === CAP) notes.push("max result (" + max + ") exactly equals the capture cap - zero headroom, as documented.");

/* ---- the upsell guard -------------------------------------------------- */
var NOW_CEILING = 12.5;
if (meanNow > NOW_CEILING) fail('mean "Start here" cards is ' + meanNow.toFixed(1) + ", above " + NOW_CEILING + ". Demote something - a wall of Start here cards is the upsell this product refuses.");

/* ---- freshness of the honest cost -------------------------------------- */
var p = String(E.CHECKED).split("-");
var now = new Date();
var ageM = (now.getFullYear() - Number(p[0])) * 12 + (now.getMonth() + 1 - Number(p[1]));
if (ageM > 6) fail("TOOLS CHECKED is " + E.CHECKED + ", " + ageM + " months old. Re-check the prices; a stale honest cost is a broken promise.");

/* ---- report ------------------------------------------------------------ */
console.log("combinations      " + n);
console.log("cards             mean " + meanCards.toFixed(1) + "   max " + max + "   cap " + CAP);
console.log('"Start here"      mean ' + meanNow.toFixed(1) + "   max " + nowMax);
console.log("missing alts      " + noAlt);
console.log("missing layer     " + noLayer);
console.log("STAGES " + E.STAGES.length + "   COMPETES " + Object.keys(E.COMPETES).length +
            "   TOOLS " + Object.keys(E.TOOLS).length + "   CHECKED " + E.CHECKED);
notes.forEach(function (m) { console.log("note: " + m); });
if (fails.length) {
  console.error("\nSWEEP FAILED");
  fails.forEach(function (m) { console.error("  - " + m); });
  process.exit(1);
}
console.log("\nsweep ok");
```

**Proof - the green run**, executed today against a marked copy of the current tree:

```
combinations      2592
cards             mean 17.7   max 24   cap 24
"Start here"      mean 12.0   max 16
missing alts      0
missing layer     0
STAGES 16   COMPETES 26   TOOLS 83   CHECKED 2026-09
note: max result (24) exactly equals the capture cap - zero headroom, as documented.

sweep ok
```

4.5 s. `npm run verify` total: 0.57 s tests + 4.5 s sweep = about 5.1 s.

**Correction to the previous plan.** The plan committed in `68a3e46` reported
`mean 11.5` "Start here" cards and concluded that "the number moved and nothing noticed".
That was its own bug, not a drift: it counted `badge === "core"`, whereas the product
counts everything that is not `badge === "later"` (`index.html:1446`, which also scores
`"heads"` and unbadged cards as now). Reading `coherence.now` instead reproduces
**mean 12.0, max 16** - exactly what `CLAUDE.md:190` and `docs/CONVENTIONS.md:159` claim.
Those two numbers are correct and must not be "corrected" during T1-3.

**Proof - the red runs.** Eight regressions injected one at a time, each restored after.
Every one exits 1 with a named, actionable message:

| Injected fault | Exit | Output |
|---|---|---|
| cap lowered to 20 in `cleanStack` | 1 | `max result is 24 cards but api/capture.js caps at 20. Raise the cap in the same commit.` |
| one option value changed in `api/share.js` | 1 | `VALID drift: api/share.js does not match Q_VALUES in index.html. Shared links and capture will 400 on valid answers.` |
| `CODE` map drifts from `Q_VALUES` | 1 | `VALID drift: the CODE map in index.html does not match Q_VALUES. Share links will drop or mis-encode an answer.` |
| two `CODE` answers share a letter | 1 | `CODE map has duplicate letters within: type. Two answers would decode to the same value.` |
| `ENGINE:END` marker deleted | 1 | the named marker error, no stack trace |
| `CHECKED` set to `2025-01` | 1 | `TOOLS CHECKED is 2025-01, 20 months old. Re-check the prices; a stale honest cost is a broken promise.` |
| `"Code home"` dropped from `ROLE2STAGE` | 1 | `roles missing from ROLE2STAGE (they fall into 'build' and lose their counterfactual): Code home` plus `2592 cards carry no alternatives` |
| `VALID` renamed out of `api/share.js` | 1 | `api/share.js: could not read the VALID whitelist. Contract 2 is unverifiable.` |

The `ROLE2STAGE` row was singled out and re-tested independently for vacuity: the
`hasOwnProperty` guard does fire on its own, and it is not merely riding on the
"no alternatives" failure that the same fault also triggers.

**One green run that must stay green:** adding a `// the six kinds` comment inside `VALID`
in `api/share.js` - a purely cosmetic edit - exits 0. An earlier draft of this gate failed
it, which would have meant a developer breaking the build by explaining their own code.

**Known limits of this gate**, stated so nobody over-trusts it:

- Every parse in it is **fail-closed**: anything it cannot read produces
  `could not read ... Contract 2 is unverifiable` and exit 1, never a silent pass. It
  tolerates `//` and `/* */` comments and trailing commas inside `VALID`/`CODE`, so ordinary
  reformatting does not trip it; renaming or restructuring those declarations does, by
  design. Verified both directions - see the green run below the red table.
- **Neither script records an `index.html` line number**, comments included. Where one is
  needed to find something the reader asks for `grep -n`. This is load-bearing: the whole
  defect being fixed here is a line number that went stale, and T1-1's own two-line
  insertion would stale any number written today.
- `NOW_CEILING` is **12.5** against a current mean of **12.0** - half a card of slack.
  CLAUDE.md:190 says to demote something "past ~12", so between 12.0 and 12.5 the guidance
  fires and the gate does not. That is deliberate: the gate is the hard floor, not the
  editorial judgement. If the mean ever sits in that band, tighten the ceiling rather than
  letting it become the target.
- It does not test rendering, the canvas, or any `/api` handler beyond reading two
  constants out of them. `index.html` above line 1541 remains untested. This closes the
  engine gap, not the frontend gap.

**Also in this commit** - correct `docs/CONVENTIONS.md:118-127` to replace the broken `sed`
recipe with `npm run verify`, and add `verify` to `package.json`.

### T1-3. Repoint the 15 instructions, and stop hand-typing current-state facts

**Artifact** edits to all **11** files listed in "Biggest constraint": `CLAUDE.md` (3
references, including `:46`), `CONTEXT.md` (2), `APPLY.md` (2), `docs/CONVENTIONS.md` (3),
`docs/MODULE_MAP.md` (2), `.claude/skills/engine-change/SKILL.md` (2), `add-a-tool`,
`edit-index-html`, `run-tests` and `data-contracts` (1 each), `.claude/commands/done-check.md` (1).
Work from that enumerated list, not from memory - an earlier draft of this plan
undercounted it by four and would have shipped `CLAUDE.md:46` untouched.

**Why** Rule 7. Fifteen instructions currently point at a command that cannot run; leaving
them is worse than having no instruction, because an agent that tries and fails learns to
skip the step. This commit comes last because T1-1 shifts line numbers and T1-2 changes
what the correct instruction is.

**Content**

1. Every one of the 10 imperatives becomes **`npm run verify`**. No file keeps a copy of
   the recipe. Delete the `sed`-based recipe block at `docs/CONVENTIONS.md:118-127` outright
   rather than repairing its line numbers.
2. `CLAUDE.md:113` currently asserts `index.html` is at md5 `2b5e2083...`. It is
   `9be09861...`. Delete the md5 and the line count from the prose rather than correcting
   them - `npm run verify` prints the live numbers, and a hand-typed current-state fact in
   this repo has now been wrong twice. Keep the historical "indexed against 2024 lines,
   md5 `33c3da71...`" line in `docs/`: that one is a dated record, not a current claim.
3. Leave the sweep figures in `CLAUDE.md:190` / `docs/CONVENTIONS.md:159` alone. Verified
   correct today - see the correction note above.
4. **Do not attempt to repair `index.html` line references.** Checked today: there are
   **220** `index.html:<line>` references in the repo and **all 220 are in `docs/`**, whose
   five files each carry an "indexed 2026-09-04, line numbers drift with every edit" header
   and which CLAUDE.md already declares STALE. They are off by hundreds of lines already;
   T1-1's two-line insertion moves them by one or two. Promising to fix them would be a new
   instance of the exact defect this plan is about - a rule nothing can satisfy. The
   standing contract is `grep -n`, and it is already written in CLAUDE.md. Zero such
   references exist in `CLAUDE.md`, the skills, or the commands, so **no instruction-carrying
   file is affected by the marker insertion at all**. Verified: `grep -rn 'CLAUDE\.md:[0-9]'`
   returns nothing outside this plan.

**Proof** `grep -rn "sed -n '356" . --include=*.md` returns nothing outside this plan, and
`grep -rn 'sweep\|Sweep\|356,1369' --include=*.md .` returns 19 hits in 11 files of which
**zero** still point at a command that cannot run. Report CLAUDE.md line count before (271)
and after.

## Tier 2 - trigger stated, not now

| Item | Trigger that would start it |
|---|---|
| **`Stop` hook running `npm run verify`** at `.claude/settings.json` `hooks.Stop` (sibling key to the existing `SessionStart`, not a second top-level object). Must exit 2 to block, early-return on `stop_hook_active: true`, and exit non-zero if `$CLAUDE_PROJECT_DIR` is unset or `node` is missing - a gate that exits 0 on its own failure is advisory again. | The first session that is left to run unattended, or the first time a `decide()` edit reaches a commit without `verify` having been run. Not before: today every session is watched, and the hook would spend 5 s on every turn end including pure-docs turns. |
| **`PreToolUse` hook on `Bash` matching `git push`** to make CLAUDE.md's "ask before push" deterministic rather than advisory. | The first push that happens without being asked for. Currently `.claude/settings.json` already has `"ask": ["Bash(git push*)"]`, which covers the agent path; the hook only adds value if that permission is ever loosened. |

**Both are Tier 2 and not Tier 1 deliberately.** Audit §5b warns that hook config may not
be live in the session that writes it, so writing and proving a hook is a two-session job.
Worth noting: the §4 reading says settings files are now watched and picked up live
mid-session. That contradicts §5b of `AGENT-WORKFLOW-AUDIT.md`. **Do not trust either
until it is tested** - when a hook is eventually added, break it on purpose in the writing
session and see whether it fires. If it does, §5b of the audit file is out of date and
should be amended.

## Tier 3 - trigger stated, not now

| Item | Trigger |
|---|---|
| **`core.hooksPath` pre-commit** running the same `npm run verify` | A second contributor, or the first time a human commit lands a `decide()` change that the agent gates would have caught. With one author and `git config core.hooksPath` unset today, it duplicates the Stop hook. |
| **GitHub Actions running `npm run verify` on push** | The first time a local-only gate is bypassed, or the moment anything merges through GitHub's button. There is no `.github/` directory at all today, and CLAUDE.md's PR warning (a GitHub-authored merge commit silently freezes Vercel) means CI is a second-order concern behind never using that button. |

## Rejected

| Mechanism | Why | Evidence |
|---|---|---|
| Multi-agent team / swarm on the product code | Every change of substance lands in one 2431-line file. Subagents cannot see each other's edits, so parallel writers to `index.html` would collide by construction. | 12 of the last 200 file-touches are `index.html`; §4 source 7 names context pollution, real parallelism and specialization as the only three bars - this clears none |
| Graph / DAG orchestration framework | There is no pipeline. One command (`npm run verify`) is the whole gate, and it runs in 5 s. | `package.json` has 2 scripts and no build step |
| `/batch` or a `claude -p` fan-out loop | Fan-out earns its ~15x token cost only on many independent edits. This repo's edits are interdependent registry changes where one `mod()` forces a cap change and the answer space in four places. | CLAUDE.md "Frozen contracts"; `.claude/skills/add-a-tool/SKILL.md` |
| Research subagent (`.claude/agents/explorer.md`) | Trigger is >1k files. This repo has 38, and the five `docs/` index files already do this job without spending a context window. | `git ls-files \| wc -l` = 38 |
| Review subagent | Trigger fires (prod-facing) but the artifact **already exists and is specific** - it names this repo's failure modes, not generic ones. Adding a second is duplication. | `.claude/agents/code-reviewer.md`, 2306 bytes |
| A new skill per workflow | Trigger is >=3 repeated commit subjects. Max repetition is 2, and 7 skills already cover the recurring work. Adding an eighth spends description budget on every session for no observed repetition. | `git log --format='%s' -300 \| sort \| uniq -c` |
| Code-intelligence plugin | Requires a type system. `index.html` is deliberately ES5-style `var`/`function`, and the reviewer treats `let`/`const`/arrows as drift to flag. | `.claude/agents/code-reviewer.md`, "Frontend style drift" |
| Packaging `.claude/` as a plugin | Trigger is many contributors. One human author across 40 commits. | `git log --format='%an' -300` |
| Git worktrees | Directly contradicts CLAUDE.md's "one branch, one working tree, one version of every file", which exists because this repo auto-deploys and a split tree hides what is current. | CLAUDE.md "Branching: there isn't any" |
| Replacing the GitHub / Vercel MCP servers with CLIs | The §3 preference is CLI-first, but neither CLI is installed here - `command -v gh` and `command -v vercel` both fail. The MCP servers are not duplicating anything. | shell check today |
| Moving DB work to an MCP server | `psql` **is** installed (`/usr/bin/psql`), so DB access already has the cheaper path, and `db/schema.sql` is applied by hand in the Neon console by owner decision. | `command -v psql`; CLAUDE.md frozen contract 1 |
| Rewriting CLAUDE.md down under 200 lines | It is 271 and the flag fires, but ~60 of those lines are the frozen-contract and pitfall text that is the reason this repo has not broken its own invariants. Cutting it to hit a number would delete the working part. T1-3 removes the *wrong* lines instead, which is the actual defect. | `wc -l CLAUDE.md` = 271; CLAUDE.md "Non-negotiables", "Frozen contracts" |

## Flags

1. **The Supabase MCP server is attached to this session and the project does not use
   Supabase.** Supabase appears in the repo only as a *recommended competitor tool* inside
   `TOOLS` (`index.html:468`, `:474`, `:476`) and as this repo's named failure story - the
   spin-up panel once said "open Supabase" while the card recommended Neon. Its tool
   definitions cost context in every session for zero use. Detach it. Session config, not
   a repo file, so it is a flag and not a Tier item.
2. **A rule this environment cannot satisfy.** CLAUDE.md's "Branching: there isn't any -
   commit directly to `main`" is contradicted by this cloud session, which mandates
   `claude/lucid-goldberg-1v42fo`. Rule 7 says fix the rule or the environment, not restate
   it. Concretely: CLAUDE.md should say `main` is the only *long-lived* branch and that a
   cloud session's mandated branch is squash-landed locally per the existing PR recipe -
   which is already written three paragraphs further down. One sentence, not a rewrite.
3. **The em-dash rule is unenforced in the file that states it.** CLAUDE.md's Definition
   of done says "New prose uses plain hyphens, no em dashes", and `code-reviewer.md` flags
   "any em dash in new prose, in any file". `CLAUDE.md` contains **31** em dashes, starting
   at line 1 (`# CLAUDE.md - standing context for Groundwork`). Stated precisely, because
   an earlier draft of this plan got it wrong in both directions: it cited `:109` and `:113`,
   which contain the **ellipsis** `…` in truncated md5 hashes and no em dash at all, and it
   missed all 31 real ones. The rule says *new* prose, so the existing text is not itself a
   violation - but any of those lines edited during T1-3 becomes new prose and must come
   back with a hyphen. Not worth its own commit, and not worth a sweeping find-and-replace
   either: converting all 31 would churn the highest-churn file in the repo for no
   behavioural gain.

## Reading

All seven sources fetched and verified today; none cited from memory.

- `https://code.claude.com/docs/en/hooks-guide` - `Stop` takes no matcher; **exit 2 blocks**
  with stderr as the reason, any other non-zero is a non-blocking error. Directly shapes the
  Tier 2 hook: exit 1 would make it advisory.
- `https://code.claude.com/docs/en/hooks` - Stop hooks receive `stop_hook_active`; Claude
  Code overrides a Stop hook after 8 consecutive blocks. A gate that can be outlasted is not
  a substitute for CI on its own.
- `https://code.claude.com/docs/en/skills` - frontmatter supports `paths:`, which would
  auto-scope `edit-index-html` to the one file it protects. Noted, not proposed - the skill
  already triggers reliably by description.
- `https://code.claude.com/docs/en/sub-agents` - only `name` + `description` are required;
  `isolation: worktree` is available and is the thing to avoid here (see Rejected).
- `https://code.claude.com/docs/en/best-practices` - "Claude stops when the work looks done.
  Without a check it can run, 'looks done' is the only signal." That sentence is this plan's
  Tier 1 in full.
- `https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents` -
  context is a finite resource with diminishing marginal returns. Why Rejected is long.
- `https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them` -
  "outside these situations, the coordination costs typically exceed the benefits."

## §7 Measure - baseline recorded today, re-read 2026-09-28

| Metric | 2026-09-14 |
|---|---|
| Runnable checks covering `index.html` | 0 |
| Runnable checks covering `api/` | 2 suites, 12 assertions, 0.57 s |
| Instructions pointing at a command that cannot run | 15 |
| Current-state facts in prose that nothing derives | 2 wrong (`CLAUDE.md:113` md5, line count) |
| Frozen contracts enforced by a machine | 0 of 4 |
| Frozen contracts enforced after Tier 1 | 2 of 4 (cap; the answer space in all 4 places) |
| Wall time of the full gate | 0.57 s (would be 5.1 s) |

If corrections per task have not dropped by 2026-09-28, the added files are noise - delete
and re-audit.

## Appendix: raw inventory

```
38 tracked files, 40 commits, clean tree at e65b33b
extensions: 23 md, 5 js, 4 json, 2 sql, 1 sh, 1 html
package.json scripts: test="node --test", test:live="RUN_LIVE=1 node --test"
no Makefile, justfile, Taskfile, pyproject, tox.ini
no .github/ directory, no CI workflows
no .claude/hooks/ directory; no .claude/settings.local.json; core.hooksPath unset
.claude/: settings.json (permissions allow/deny/ask + SessionStart hook),
          agents/code-reviewer.md,
          commands/done-check.md, commands/test.md,
          skills/ add-a-tool, audit, data-contracts, edit-index-html,
                  engine-change, run-tests, verify-live
authors:  24 simonskok, 10 Claude, 6 simonskok1-source
churn:    CLAUDE.md 16, index.html 12, README.md 9, package.json 5,
          docs/SYMBOL_INDEX.md 5, docs/DATA_FLOW.md 5, .claude/settings.json 5
env vars: GEMINI_API_KEY, GROQ_API_KEY, AI_PROVIDER, TAILOR_MODEL, DATABASE_URL
sizes:    CLAUDE.md 271, README.md 132, HANDOFF.md 165, APPLY.md 95,
          CONTEXT.md 84, ENVIRONMENT.md 54, index.html 2431 (md5 9be09861...)
CLIs:     node, npm, git, jq, psql installed; gh and vercel NOT installed
npm test: exit 0, 12 pass / 3 skip, 0.57 s real
sweep:    documented recipe exits non-zero, SyntaxError: Unexpected token '<'
```
