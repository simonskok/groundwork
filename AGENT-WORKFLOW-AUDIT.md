# AGENT WORKFLOW AUDIT

Put this file at the repo root. Open Claude Code in that folder. Send:

```
Read AGENT-WORKFLOW-AUDIT.md and execute it.
```

Every run ends by printing the next prompt. Paste it back into Claude Code. Repeat until it
prints `NEXT: nothing`. You write nothing yourself after the first line.

Runs in Claude Code only. It needs a working tree, git, and the ability to run the project's
own commands. If there is no repo here, say so and stop.

---

## 0. Rules

Apply before recommending anything.

1. **Verification beats orchestration.** A single agent with a check it can run and re-run
   outperforms any multi-agent arrangement without one. The check comes first.
2. **Context is the binding constraint.** Performance degrades as the window fills. Justify
   every recommendation in tokens saved or noise removed.
3. **Multi-agent is for read-heavy parallel search.** Research, archaeology, independent-file
   migrations. ~15x the tokens, and unreliable for interdependent writing, because subagents
   can't see each other's decisions.
4. **Determinism beats instruction.** What must happen every time goes in a hook or CI.
   Instructions are requests; hooks are guarantees.
5. **Automate what's been done manually 3+ times.** Codify observed repetition, not imagined.
6. **Every file costs context.** CLAUDE.md loads always; skills load on demand. New knowledge
   defaults to a skill.
7. **A rule that can't be satisfied gets silently reinterpreted.** If the repo mandates
   something its own environment can't do, that's the finding — fix the rule or the environment,
   don't restate it.

A mechanism failing 1–7 goes in Rejected with the reason.

---

## 1. Inventory

Delegate to a subagent so raw output stays out of the main context. Run as one batch.

```bash
git rev-parse --show-toplevel && git log --oneline -1

git ls-files | wc -l
git ls-files | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -30
git ls-files | awk -F. '{print $NF}' | sort | uniq -c | sort -rn | head -15

ls -la .claude/ CLAUDE.md AGENTS.md AGENT_CONTEXT.md .github/workflows/ 2>/dev/null
find . -path ./node_modules -prune -o -name "SKILL.md" -print 2>/dev/null
cat .claude/settings.json 2>/dev/null

grep -A25 '"scripts"' package.json 2>/dev/null
ls Makefile justfile Taskfile.yml pyproject.toml tox.ini 2>/dev/null
git ls-files | grep -Ei '(test|spec)' | wc -l
ls .github/workflows/*.yml 2>/dev/null

git log --format='%s' -300 | cut -c1-30 | sort | uniq -c | sort -rn | head -20
git log --format='%an' -300 | sort | uniq -c | sort -rn
git log --format=format: --name-only -200 | grep . | sort | uniq -c | sort -rn | head -20

cat .env.example 2>/dev/null | cut -d= -f1
wc -l CLAUDE.md 2>/dev/null
```

Then **run the project's own test command and time it.** Paste the real exit code. This single
fact decides most of Tier 1, and it is the one thing that cannot be inferred.

Read: README, `AGENT_CONTEXT.md` if present, the 3 highest-churn files, the newest 5 diffs.

---

## 2. Classify

Evidence only. Cite a file or command output per line. Never estimate a number you can measure.

| Signal | Values | Evidence |
|---|---|---|
| Project kind | app / library / service / pipeline / infra / content | |
| Verification | full CI + tests / tests only / lint only / **none** | |
| Does it pass today? | exit code, timing, what fails and why | |
| File count | <100 / 100–1k / 1k–10k / >10k | |
| Type system | typed / gradual / dynamic | |
| Task shape | many independent edits / few interdependent / mostly research | |
| Repetition | top 3 repeated commit subjects | |
| Who commits | agent-authored vs human-authored, counts | |
| External systems | DB, APIs, cloud, trackers, deploy | |
| Team size | solo / small / many | |
| Failure cost | reversible / prod-facing / regulated | |
| Existing config | none / CLAUDE.md / skills / hooks / subagents / plugins | |
| CLAUDE.md size | line count | |

---

## 3. Map signals to mechanisms

Only when the trigger fires.

| Trigger | Mechanism | Artifact |
|---|---|---|
| Verification = none, or exits non-zero for environmental reasons | **Make the check satisfiable first** | `verify` command with a real exit code. If it fails because the environment can't do something, fix that — skip-when-offline, stub, or move to CI. Everything else waits. |
| Verification passes, unattended runs wanted | **Stop hook** | Runs `verify`, blocks turn end until green |
| Rules the agent keeps violating | **Hook, not CLAUDE.md** | `PostToolUse`, matcher `Write\|Edit` |
| Human commits bypass agent gates | **`core.hooksPath` pre-commit** | Same script both paths. The agent hook becomes convenience, not the gate. |
| Repeated commit subjects ≥3 | **Skill per workflow** | `.claude/skills/<verb>/SKILL.md` with `## Gotchas` |
| Non-obvious build/env quirks | **CLAUDE.md** | Commands it can't guess, env quirks, gotchas, PR etiquette. Nothing derivable from code. |
| File count > 1k | **Research subagent** | `.claude/agents/explorer.md`, tools `Read, Grep, Glob` |
| Prod-facing or regulated | **Review subagent** | Reviews diff against plan, correctness gaps only |
| Many small independent edits | **Fan-out** | `/batch`, or `claude -p` loop with `--allowedTools`. The only place swarms earn their cost. |
| Few deep interdependent changes | **Single agent + plan mode + spec** | Interview → `SPEC.md` → fresh session. Reject multi-agent explicitly. |
| External systems | **CLI first, MCP second** | `gh`, `psql`, `aws` cost less context than an MCP server |
| Typed language | **Code-intelligence plugin** | `/plugin` |
| Many contributors | **Commit `.claude/`, package as plugin** | |

**Tiers.** T1 = the check + CLAUDE.md + one skill. T2 = hooks + research subagent. T3 = review
subagent, fan-out, plugin packaging. Never T3 before T1 exists. Never bundle a
no-precondition fix with a risky one — split them across tiers.

---

## 4. Reading

Delegate: `use a subagent to research <the triggers that fired>`. Pick 3–6, one line each on
what changes here. Verify paths against `https://code.claude.com/docs/llms.txt`. If fetch and
search are both blocked, write `TODO` — never cite from memory.

- Claude Code best practices — https://code.claude.com/docs/en/best-practices
- Extend Claude Code — https://code.claude.com/docs/en/features-overview
- Effective context engineering — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- When to use multi-agent systems and when not to — https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them
- How we built our multi-agent research system — https://www.anthropic.com/engineering/built-multi-agent-research-system
- Building effective agents — https://www.anthropic.com/engineering/building-effective-agents
- Cognition, "Don't build multi-agents" — read against the two above
- Writing effective tools for agents — https://www.anthropic.com/engineering/writing-tools-for-agents
- Hooks — https://code.claude.com/docs/en/hooks-guide
- Skills — https://code.claude.com/docs/en/skills
- Subagents — https://code.claude.com/docs/en/sub-agents
- Worktrees — https://code.claude.com/docs/en/worktrees

---

## 5. Write `AGENT_WORKFLOW_PLAN.md` at the repo root

```markdown
# Agent Workflow Plan — <repo>
Branch: <name> | Pushed: yes/no | Date: <date> | Commit: <sha>
SECTIONS DONE: <n>   SECTIONS OPEN: <n>
NEXT: <what>

## Current state          <5 lines, from §2>
## Biggest constraint     <one sentence, with evidence>

## Tier 1
Per item: **Artifact** (exact path) / **Why** (the §2 signal) / **Content** (the real file,
ready to write) / **Proof** (the command, and what output counts as pass)

## Tier 2 — trigger stated
## Tier 3 — trigger stated

## Rejected
| Mechanism | Why | Evidence |
<Name every popular pattern that doesn't apply: multi-agent teams, graph orchestration,
MCP duplicating a CLI. Reject on evidence, not on a remembered claim — if you can't source
the claim, cut it and reject on placement.>

## Reading
## Appendix: raw inventory
```

### 5b. Check the proofs before you hand it over

Run a reviewer subagent in fresh context. Every one of these has bitten a real run:

```
Review AGENT_WORKFLOW_PLAN.md against the §2 evidence. Report correctness gaps only:
- Does every Tier 1 item trace to a signal that actually fired?
- Is any proof self-invalidating — a check the edit itself will break? (Moving lines
  breaks file:line references. Find and fix them in the same commit, not after.)
- Does any item need config that isn't loaded until the session restarts? Hook config
  is snapshotted at session start, so a hook written this session cannot be proven
  this session. Split write and proof into separate steps.
- Does any hook fail OPEN? Missing jq, empty read, unmatched case, unset project dir —
  each must exit non-zero. A gate whose failure mode is "allow" is advisory again.
- Does any hook edit sit at the wrong nesting level in settings.json? New event blocks
  are sibling keys inside the existing `hooks` object. A second top-level entry is
  invalid JSON and the whole file gets dropped.
- Does any justification claim more than the mechanism delivers? PreToolUse covers
  agent commits only.
- Do numeric targets and Tier 2 triggers leave a dead zone where nothing fires?
```

Fold in the findings. A reviewer asked for gaps will find some even when the work is sound —
fix what affects correctness, mark the rest optional.

Then stop. Do not implement until approved.

---

## 6. Implement — after approval

Tier 1 only. One commit each, in order. Reviewer subagent before each commit.

1. The check. Run it, show real timing and real exit code. If the correct result today is a
   failure, say so and name what fails — a green result would mean the check is wrong.
2. Hooks: write and commit. Do **not** claim they work. Stop and say a new session is needed.
3. (new session) Break the thing on purpose, show the refusal verbatim, undo, show the pass.
4. CLAUDE.md and skills. Before committing, `grep -rn 'CLAUDE\.md:[0-9]'` and fix every shifted
   reference in the same commit. Report before/after line count.
5. Update `SECTIONS DONE`.

Never rewrite commit authorship. Author identity may be a deploy credential, and the failure
mode is silent: green CI, successful preview, production frozen.

---

## 7. Measure

Record now, again in two weeks. Set the date.

- Corrections per task
- Sessions needing `/clear`
- Tasks completed unattended with the check green
- Token spend per merged PR

If corrections per task didn't drop, the added files are noise. Delete and re-audit.

---

## 8. End every run this way

```
DONE: <sections>
BLOCKED: <sections and why, one line>
WORK IS AT: <absolute path> | branch <name> | pushed: yes/no
NEXT — paste into Claude Code (<this session | a NEW session, because ...>):

<the exact prompt, ready to copy>
```

- NEXT never routes anywhere but Claude Code.
- If the branch is unpushed and the session is a cloud sandbox, say in BLOCKED that the work
  dies when the sandbox resets, and give the command to get it out.
- If nothing remains: `NEXT: nothing — re-measure §7 on <date>.`
- Never end with a question.

---

## Cheat sheet

| Question | Mechanism | Loaded |
|---|---|---|
| Know always? | CLAUDE.md | every session |
| Know sometimes? | Skill | on demand |
| Must happen, always? | Hook | deterministic |
| Noisy or parallel work? | Subagent | separate context |
| Reach outside the repo? | CLI first, MCP second | per call |
| Whole team gets it? | Plugin | installed |

## Flag if found

- CLAUDE.md over ~200 lines, or anything derivable from the code
- A rule stated in CLAUDE.md that should be a hook
- A rule the environment cannot satisfy
- Subagents defined but never invoked
- MCP duplicating an installed CLI
- Multi-agent where subtasks edit the same files
- Automation with no pass/fail check
- A hook that exits 0 on its own failure
