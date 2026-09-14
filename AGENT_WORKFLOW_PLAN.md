# Agent Workflow Plan - groundwork
MODE: CC-LOCAL | Date: 2026-09-14 | Commit: f957d6c
SECTIONS DONE: 0.5, 1, 2, 3, 4, 5   SECTIONS OPEN: 6 (needs approval), 7 (two weeks out)
NEXT: approve or amend Tier 1 below, then implement it in this repo.

## Current state

Solo repo, 35 tracked files, 36 commits, one runtime dependency. The product is one
2431-line `index.html` plus three CommonJS serverless functions. Agent config is already
mature: CLAUDE.md, 6 skills, 2 commands, a review subagent, a SessionStart hook, and a
permission allowlist with real deny rules. This is not a bare repo, so most of the usual
recommendations are already in place and are rejected below rather than repeated.

The gap is not missing scaffolding. It is that the scaffolding points at a check that
does not run.

## Biggest constraint

**The only verification covering the product's core logic has been silently broken for
at least 400 lines of drift, and 11 places in the repo still tell an agent to run it.**

Evidence:

- `docs/CONVENTIONS.md:122` extracts the engine with `sed -n '356,1369p' index.html`.
  Line 356 is now `<div class="herogrid">` and line 1369 is a line of `plan.push(...)`.
  Running the recipe verbatim produces `SyntaxError: Unexpected token '<'`.
- The `<script>` block actually starts at `index.html:456`. The file grew 2024 -> 2431
  lines since the recipe was written, exactly the drift CLAUDE.md warns about.
- 11 files point at that recipe: `CLAUDE.md:190`, `CLAUDE.md:247`, `APPLY.md:59`,
  `APPLY.md:82`, `docs/CONVENTIONS.md:159`, `docs/MODULE_MAP.md:337`, `CONTEXT.md:50`,
  `CONTEXT.md:67`, and the `engine-change`, `add-a-tool`, `edit-index-html`, `run-tests`
  and `data-contracts` skills plus `/done-check`.
- `npm test` is green (12 pass, 3 skip, 347 ms) and covers `api/tailor.js` and
  `api/capture.js` only. `api/share.js` and all 2431 lines of `index.html` have no
  automated coverage at all.
- The drift is already measurable. CLAUDE.md:190 claims `mean 12.0 "now", max 16`.
  A corrected sweep run today gives **mean 11.5, max 16**. The number moved and nothing
  noticed, because the thing that would have noticed does not run.

Everything in Tier 1 follows from this. A repo that auto-deploys to production on push,
whose core logic has no runnable check, is one bad `decide()` edit away from shipping a
wrong recommendation to every visitor.

## Tier 1 - do now

### T1-1. Make the engine check runnable

**Artifact** `scripts/engine.js` and two comment markers in `index.html`

**Why here** The §3 trigger "Verification = none" fires for `index.html`, which is the
product. Rule 4: the sweep is currently an instruction, so it is a request. Anchoring on
markers instead of line numbers is what makes it a guarantee in a file CLAUDE.md itself
says drifts constantly.

**Content** Add exactly two lines to `index.html`, no behaviour change:

- `/* ENGINE:START */` immediately after `<script>` (currently line 456)
- `/* ENGINE:END */` immediately before `/* ---------- Canvas rendering ----- */`
  (currently line 1542)

Then `scripts/engine.js`:

```js
// Extract the DOM-free region of index.html and load it as a module.
// Anchored on markers, never line numbers - index.html drifts constantly.
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
      "The engine sweep is anchored on them. Restore both markers around the\n" +
      "DOM-free region (the run of code from STAGES down to graphTargets)."
    );
  }
  return html.slice(a + START.length, b);
}

function load() {
  var body = [
    'var window={matchMedia:function(){return{matches:false};}};',
    slice(),
    'module.exports={decide:decide,recommend:recommend,Q_VALUES:Q_VALUES,' +
    'STAGES:STAGES,NODES:NODES,TOOLS:TOOLS,COMPETES:COMPETES,' +
    'ROLE2STAGE:ROLE2STAGE,CHECKED:CHECKED};'
  ].join("\n");
  var tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "gw-engine-")), "engine.js");
  fs.writeFileSync(tmp, body);
  return require(tmp);
}

module.exports = { load: load, slice: slice, ROOT: ROOT };
```

**Proof it worked** `node -e "require('./scripts/engine.js').load()"` exits 0. Deleting
either marker produces the named error, not a `SyntaxError`. Verified against a marked
copy of the current `index.html` before this plan was written.

### T1-2. Turn the sweep into a gate with a real exit code

**Artifact** `scripts/sweep.js`, and `"verify": "node --test && node scripts/sweep.js"`
in `package.json`

**Why here** Rule 1: a check that only prints numbers is a report, not a check. This one
asserts, and two of its assertions mechanically enforce frozen contracts that currently
rely on a human remembering: the capture cap (contract 3) and the three-copy `VALID`
whitelist (contract 2). It reads the cap out of `api/capture.js` and the whitelists out
of `api/share.js` and `api/capture.js`, so the copies cannot drift apart in silence.

**Content**

```js
// Headless sweep of the recommendation engine. Exit 0 green, exit 1 red.
// Covers what npm test cannot reach: decide()/recommend() inside index.html.
var fs = require("fs");
var path = require("path");
var engine = require("./engine.js");

var ROOT = engine.ROOT;
var E;
try { E = engine.load(); }
catch (e) { console.error("SWEEP FAILED\n  - " + e.message); process.exit(1); }
var fails = [];
var notes = [];
function fail(m) { fails.push(m); }

/* ---- the whole answer space -------------------------------------------- */
var QV = E.Q_VALUES, keys = Object.keys(QV);
var all = [{}];
keys.forEach(function (k) {
  var next = [];
  all.forEach(function (o) {
    QV[k].forEach(function (v) { var c = Object.assign({}, o); c[k] = v; next.push(c); });
  });
  all = next;
});

/* ---- contract 1: the capture cap, read from api/capture.js -------------- */
var capSrc = fs.readFileSync(path.join(ROOT, "api", "capture.js"), "utf8");
var capM = capSrc.match(/\.slice\(0,\s*(\d+)\)/);
if (!capM) fail("api/capture.js: could not find the cleanStack cap (s.slice(0, N)).");
var CAP = capM ? Number(capM[1]) : 0;

/* ---- contract 2: VALID, three copies ------------------------------------ */
function readValid(file) {
  var src = fs.readFileSync(path.join(ROOT, "api", file), "utf8");
  var i = src.indexOf("const VALID = {");
  if (i < 0) return null;
  var j = src.indexOf("};", i);
  if (j < 0) return null;
  return eval("(" + src.slice(i + "const VALID = ".length, j + 1) + ")");
}
["share.js", "capture.js"].forEach(function (f) {
  var v = readValid(f);
  if (!v) return fail("api/" + f + ": could not read the VALID whitelist.");
  var a = JSON.stringify(Object.keys(QV).sort().map(function (k) { return [k, QV[k].slice().sort()]; }));
  var b = JSON.stringify(Object.keys(v).sort().map(function (k) { return [k, v[k].slice().sort()]; }));
  if (a !== b) fail("VALID drift: api/" + f + " does not match Q_VALUES in index.html.");
});

/* ---- the sweep ---------------------------------------------------------- */
var n = all.length, total = 0, max = 0, nowTotal = 0, nowMax = 0;
var noAlt = 0, noLayer = 0, empty = 0, badRole = {};
all.forEach(function (a) {
  var r = E.recommend(a, "");
  var mods = (r && r.mods) || [];
  if (!mods.length) empty++;
  total += mods.length;
  if (mods.length > max) max = mods.length;
  var now = 0;
  mods.forEach(function (m) {
    if (m.badge === "core") now++;
    if (!m.alts || !m.alts.length) noAlt++;
    if (!m.layer) noLayer++;
    if (!Object.prototype.hasOwnProperty.call(E.ROLE2STAGE, m.role)) badRole[m.role] = 1;
  });
  nowTotal += now;
  if (now > nowMax) nowMax = now;
});
var meanCards = total / n, meanNow = nowTotal / n;

if (empty) fail(empty + " of " + n + " combinations produced no recommendation cards.");
if (noAlt) fail(noAlt + " cards carry no alternatives (every pick must show what it beat).");
if (noLayer) fail(noLayer + " cards carry no layer.");
var missing = Object.keys(badRole);
if (missing.length) fail("roles missing from ROLE2STAGE (they fall into 'build' silently): " + missing.join(", "));
if (CAP && max > CAP) fail("max result is " + max + " cards but api/capture.js caps at " + CAP + ". Raise the cap in the same commit.");
if (CAP && max === CAP) notes.push("max result (" + max + ") exactly equals the capture cap - zero headroom, as documented.");

/* ---- the upsell guard --------------------------------------------------- */
var NOW_CEILING = 12.5;
if (meanNow > NOW_CEILING) fail('mean "Start here" cards is ' + meanNow.toFixed(1) + ", above " + NOW_CEILING + ". Demote something - this is the upsell the product refuses.");

/* ---- freshness ---------------------------------------------------------- */
var p = String(E.CHECKED).split("-");
var ageM = (new Date().getFullYear() - Number(p[0])) * 12 + (new Date().getMonth() + 1 - Number(p[1]));
if (ageM > 6) fail("TOOLS CHECKED is " + E.CHECKED + ", " + ageM + " months old. Re-check prices; an honest cost that is stale is a broken promise.");

/* ---- report ------------------------------------------------------------- */
console.log("combinations      " + n);
console.log("cards             mean " + meanCards.toFixed(1) + "   max " + max + "   cap " + CAP);
console.log('"Start here"      mean ' + meanNow.toFixed(1) + "   max " + nowMax);
console.log("missing alts      " + noAlt);
console.log("missing layer     " + noLayer);
console.log("STAGES " + E.STAGES.length + "   COMPETES " + Object.keys(E.COMPETES).length + "   TOOLS " + Object.keys(E.TOOLS).length + "   CHECKED " + E.CHECKED);
notes.forEach(function (m) { console.log("note: " + m); });
if (fails.length) {
  console.error("\nSWEEP FAILED");
  fails.forEach(function (m) { console.error("  - " + m); });
  process.exit(1);
}
console.log("\nsweep ok");
```

**Proof it worked** Already run against a marked copy of the current tree:

```
combinations      2592
cards             mean 17.7   max 24   cap 24
"Start here"      mean 11.5   max 16
missing alts      0
missing layer     0
STAGES 16   COMPETES 26   TOOLS 83   CHECKED 2026-09
note: max result (24) exactly equals the capture cap - zero headroom, as documented.

sweep ok
```

Four injected regressions, all caught, all exit 1:

| Injected fault | Output |
|---|---|
| cap lowered to 20 in `api/capture.js` | `max result is 24 cards but api/capture.js caps at 20. Raise the cap in the same commit.` |
| one option value changed in `api/share.js` | `VALID drift: api/share.js does not match Q_VALUES in index.html.` |
| `ENGINE:END` marker deleted | the named marker error, clean, no stack trace |
| a role renamed out of `ROLE2STAGE` | `2160 cards carry no alternatives` |

Total runtime `npm run verify`: 347 ms tests + 4850 ms sweep = about 5.2 s.

**Also in this commit** correct `docs/CONVENTIONS.md:118-127` and `CLAUDE.md:190` to point
at `npm run verify` and to state the real numbers, and update the 11 references listed
under "Biggest constraint" to name the command instead of the broken recipe.

### T1-3. Make the em dash rule a hook instead of a third instruction

**Artifact** `.claude/hooks/no-em-dash.sh` plus a `PostToolUse` entry in
`.claude/settings.json`

**Why here** The §3 trigger "Rules the agent keeps violating" fires hard. The rule is
written three times (CLAUDE.md "Definition of done", `.claude/commands/done-check.md:19`,
`.claude/agents/code-reviewer.md` last bullet) and is still broken in **10 of the last 30
commits**, including 51 em dashes introduced by `49bde96`, the commit that installed the
rule. 31 em dashes sit in CLAUDE.md right now and 20 in HANDOFF.md. Per the best-practices
doc: "If Claude keeps doing something you don't want despite having a rule against it, the
file is probably too long and the rule is getting lost." Rule 4 says the fix is a hook.

It reports and blocks rather than rewriting, so nothing is edited silently.

**Content** `.claude/hooks/no-em-dash.sh`, `chmod +x`:

```bash
#!/usr/bin/env bash
# PostToolUse (Edit|Write): the repo rule is plain hyphens, no em dashes.
# Instructed three times in CLAUDE.md, done-check and the reviewer, and still
# broken in 10 of the last 30 commits. A hook is the only version that holds.
set -uo pipefail
FILE=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input.file_path||"")}catch(e){}})')
[ -n "$FILE" ] && [ -f "$FILE" ] || exit 0
case "$FILE" in *node_modules/*|*package-lock.json) exit 0;; esac
HITS=$(grep -n '—' "$FILE" 2>/dev/null | head -5)
[ -n "$HITS" ] || exit 0
{
  echo "Em dash in $FILE. This repo uses plain hyphens - see CLAUDE.md, Definition of done."
  echo "$HITS" | sed 's/^/  /'
  echo "Replace each with a plain hyphen, then continue."
} >&2
exit 2
```

Added to `.claude/settings.json` alongside the existing `SessionStart` block:

```json
"PostToolUse": [
  {
    "matcher": "Edit|Write",
    "hooks": [{ "type": "command", "command": "bash .claude/hooks/no-em-dash.sh" }]
  }
]
```

`node` is used rather than `jq` because `package.json` already requires Node >= 18 and
`jq` is not guaranteed on every machine.

**Proof it worked** Tested both ways before this plan was written: a clean file exits 0
silently; a file with two em dashes exits 2 and prints

```
Em dash in <path>. This repo uses plain hyphens - see CLAUDE.md, Definition of done.
  1:line one — bad
  3:line three — also bad
Replace each with a plain hyphen, then continue.
```

Known limit: `PostToolUse` does not fire for files written by a Bash heredoc. If that
becomes the leak, switch the matcher to a `FileChanged` hook, which covers Bash writes too.

### T1-4. Prune CLAUDE.md from 271 lines to about 140

**Artifact** `CLAUDE.md`

**Why here** It is 271 lines, above the audit's 200-line anti-pattern threshold, and it is
the **single highest-churn file in the repo**: 16 of the last 200 file-touches, more than
`index.html` at 12. It loads in full on every session, including sessions that never touch
`api/` or the engine. Six skills already exist and already carry most of this content on
demand.

**Content** Move, do not delete. Each block goes where it is already half-living:

| Section | Lines | Where it goes |
|---|---|---|
| `## Known pitfalls` | 46 | Split into `engine-change`, `add-a-tool`, `data-contracts`, `edit-index-html`, which already describe themselves as covering exactly these. Leave a two-line pointer. |
| `## Credentials - where they actually are` | 36 | New skill `.claude/skills/credentials/SKILL.md`. Needed only when touching `api/` or deploying, which is a minority of sessions. `.env.example` and `ENVIRONMENT.md` already carry the same facts. |
| `## Frozen contracts` | 18 | Already the stated subject of the `data-contracts` skill, which its own description says. Leave the four contract names and a pointer. |
| `## Positioning and where it's going` | 16 | `README.md` and `HANDOFF.md`. Roadmap status changes often, which the best-practices doc lists as an explicit exclude. |

Keep in full: `What this is`, `How to run`, `Where things live`, `Working agreement`,
`Non-negotiables`, `Definition of done`, `Domain language`, `Session foundation`.

Do this **after** T1-1 to T1-3, and run `/doctor` afterwards so it proposes further cuts
for anything still derivable from the code.

**Proof it worked** `wc -l CLAUDE.md` about 140. `/context` shows the smaller load. The
real proof is §7: corrections per task should fall, not rise.

## Tier 2 - after T1 has been used a week

- **Stop hook running `npm run verify`.** Trigger: "verification exists, unattended runs
  wanted". At 5.2 s it is cheap enough to gate every turn. Held to T2 only because the
  check has to exist and be trusted first. Condition to promote: T1-2 has caught at least
  one real regression, and a doc-only session has not been annoyed by it.
- **`.github/workflows/verify.yml` running `npm run verify` on push to main.** There is no
  CI at all today and `git push` deploys straight to Vercel production, so nothing checks
  the engine before visitors see it. Condition: T1-2 stable, and accept that CI reports
  after the deploy rather than before it, because the repo deliberately does not branch.
- **A `sweep-diff` mode.** Store the current sweep numbers in a committed JSON file and
  fail on unexplained movement, not just on threshold breach. This is what would have
  caught `mean 12.0` drifting to `11.5` silently. Condition: T1-2 has run long enough that
  the numbers are trusted as a baseline.

## Tier 3 - conditional, with the condition stated

- **Package `.claude/` as a plugin.** Condition: a second contributor appears. Today the
  repo is one author (`simonskok`, 20 of the last 30 commits) plus agent commits, so a
  plugin buys nothing.
- **A pre-commit author guard.** `scripts/cloud_setup.sh` pins the commit author to
  `simonskok <simonskok@yahoo.com>` because a commit authored by `simonskok1-source`
  silently stops Vercel deploying. Six such commits are already in this history
  (`439c007`, `c563087`, `19407fa`, `0d1ac6f`, `e127f09`, `b4fdfd0`), which clears the
  rule-5 bar of three. Held at T3 because the SessionStart pin already covers every Claude
  Code session, so this only closes the gap for commits made outside one. Condition: a
  seventh wrong-author commit appears.

## Rejected

| Mechanism | Why rejected |
|---|---|
| Multi-agent team, swarm, or orchestration graph | Rule 3. The subtasks would all edit `index.html`, one 2431-line file where `decide()` is the single source of truth that `recommend()`, `graphTargets()`, `renderSpinKit()` and `openCompare()` all read from. Subagents cannot see each other's decisions, and the repo's own named failure mode is exactly three copies of these rules disagreeing. This is the "few deep interdependent changes" row: single agent, plan mode, spec. |
| Research / explorer subagent | Trigger is "file count > 1k". This repo has 35 tracked files and five generated reference docs that already do the job. It would be a subagent defined and never invoked, which is on the anti-pattern list. |
| Adversarial review subagent | Already exists at `.claude/agents/code-reviewer.md`, and it is good: it names this repo's failure modes concretely. Nothing to add. |
| `/batch` or a `claude -p` fan-out | Trigger is "many small independent edits". The work here is one file with interdependent logic. |
| A new skill per repeated commit subject | Trigger is three or more repeated subjects. 36 commits with essentially 36 distinct prose subjects, and six skills already cover the real workflows. |
| Code-intelligence plugin | Trigger is a typed language. This is deliberately ES5-style vanilla JS with no build step. |
| More MCP servers | Rule: CLI first. The Vercel and Neon MCP servers are genuinely used. The **Supabase MCP server attached to this session is pure context cost**: Supabase appears in this repo only as a recommendable tool inside `index.html:468`, never as a dependency (`package.json` has exactly one, `@neondatabase/serverless`). Detaching it is free. |
| Lint, typecheck, or a build step | CLAUDE.md says none exists and not to invent one. The em dash hook covers the one style rule that actually keeps breaking, at a fraction of the cost. |
| Adding the pitfalls to CLAUDE.md as more emphasis | Rule 6 and the best-practices doc both say the opposite: the file is already too long, which is why the rules get lost. T1-4 goes the other way. |

## Reading

- Claude Code best practices - https://code.claude.com/docs/en/best-practices
  Names the exact failure here: a rule violated despite being written down means the file
  is too long, not that the rule needs repeating. Drives T1-3 and T1-4.
- Automate actions with hooks - https://code.claude.com/docs/en/hooks-guide
  Confirms the `PostToolUse` + `Edit|Write` shape and that exit 2 blocks and feeds stderr
  back as feedback. That is the mechanism T1-3 depends on.
- Hooks reference - https://code.claude.com/docs/en/hooks
  Has the `Stop` event and per-event exit-2 behaviour needed before promoting the T2 Stop
  hook. Also documents `FileChanged`, the fallback if the Bash-write leak in T1-3 matters.
- Extend Claude Code - https://code.claude.com/docs/en/features-overview
  The which-mechanism-for-which-goal table. The justification for moving four CLAUDE.md
  sections into skills rather than trimming prose.
- Effective context engineering for AI agents - https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
  Rule 2. Why a 271-line always-loaded file is a cost paid by every session including the
  ones that never touch `api/`.
- When to use multi-agent systems and when not to - https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them
  Read to justify the rejection, not to adopt it. Interdependent writing to one file is
  the case it argues against.

All six URLs were fetched or status-checked on 2026-09-14 and returned 200.

## Appendix: raw inventory

```
git ls-files | wc -l                       35
git rev-list --count HEAD                  36

extensions        20 md, 5 js, 4 json, 2 sql, 1 sh, 1 html
largest files     2431 index.html, 358 docs/MODULE_MAP.md, 271 CLAUDE.md,
                  207 docs/DATA_FLOW.md, 204 docs/SYMBOL_INDEX.md, 200 api/tailor.js

authors (last 300)   20 simonskok, 10 Claude, 6 simonskok1-source

churn (last 200)     16 CLAUDE.md, 12 index.html, 9 README.md, 5 package.json,
                     5 docs/SYMBOL_INDEX.md, 5 docs/DATA_FLOW.md,
                     5 .claude/settings.json, 4 scripts/cloud_setup.sh

package.json scripts   test: "node --test"
                       test:live: "RUN_LIVE=1 node --test"
no Makefile, no justfile, no Taskfile, no pyproject
no .github/workflows at all

npm test               15 tests, 12 pass, 0 fail, 3 skip (live), 124 ms
test files             test/capture.test.js, test/tailor.test.js
untested               api/share.js, all of index.html

existing agent config  CLAUDE.md (271 lines)
                       .claude/settings.json (allow 13, deny 11, ask 1, SessionStart hook)
                       .claude/agents/code-reviewer.md (41 lines)
                       .claude/commands/done-check.md (25), test.md (15)
                       .claude/skills/ add-a-tool 62, data-contracts 65,
                         edit-index-html 56, engine-change 85, run-tests 47,
                         verify-live 52

env vars (.env.example)  GEMINI_API_KEY, GROQ_API_KEY, AI_PROVIDER, TAILOR_MODEL,
                         DATABASE_URL

em dashes present        31 CLAUDE.md, 20 HANDOFF.md
em dashes introduced     10 of the last 30 commits, worst 49bde96 with 51

broken sweep recipe      docs/CONVENTIONS.md:122 sed -n '356,1369p'
                         index.html:356 is <div class="herogrid">
                         real <script> boundary is index.html:456 to 2431
                         verbatim run: SyntaxError: Unexpected token '<'

corrected sweep          2592 combinations, mean 17.7 cards, max 24,
                         mean 11.5 "Start here", max 16,
                         0 missing alts, 0 missing layer,
                         STAGES 16, COMPETES 26, TOOLS 83, CHECKED 2026-09
                         (CLAUDE.md:190 claims mean 12.0 - stale)
```

## §2 classification table

| Signal | Value | Evidence |
|---|---|---|
| Project kind | app (static frontend plus serverless functions) | `index.html` plus `api/*.js` on Vercel, `vercel.json` |
| Verification available | tests only, and partial | `npm test` covers 2 of 3 api files; no CI, no lint, no build |
| Verification runtime | under 10 s | 347 ms tests, 4850 ms sweep, 5.2 s combined |
| File count | under 100 | `git ls-files` = 35 |
| Type system | dynamic | vanilla ES5-style JS, CommonJS api handlers, no types anywhere |
| Task shape | few deep interdependent changes | one 2431-line file, `decide()` the single source of truth for four consumers |
| Repetition | none meaningful | 36 commits, essentially 36 distinct prose subjects |
| External systems | Neon Postgres, Vercel, Gemini, Groq | `.env.example`, `@neondatabase/serverless`, `api/tailor.js` |
| Team size | solo | 20 of 30 recent commits `simonskok`, rest agent-authored |
| Failure cost | prod-facing | `git push` triggers a Vercel production deploy, no staging, no branch |
| Existing agent config | CLAUDE.md, 6 skills, 2 commands, 1 subagent, 1 hook, permissions | `.claude/` listing above |
