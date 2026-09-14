---
name: audit
description: Audit this repo and plan which Claude Code mechanisms it should adopt — verification, CLAUDE.md, skills, hooks, subagents, fan-out. Run on a new project, or with "continue" to resume an in-progress audit.
disable-model-invocation: true
---

Read `AGENT-WORKFLOW-AUDIT.md` at the repository root and execute it against this repository.

Argument handling — `$ARGUMENTS`:

* empty — fresh run. Execute §0 through §5b in one pass, without stopping for confirmation between sections. Stop at the §5 approval gate and print the §8 block.
* `continue` — read `AGENT_WORKFLOW_PLAN.md` at the repo root, act on its header block (`SECTIONS DONE` / `SECTIONS OPEN` / `NEXT`), and execute whatever `NEXT` names. If the plan's `NEXT` says a new session is required and this is that new session, proceed. If `NEXT` is empty or the plan is missing, say so and stop.
* anything else — treat it as a constraint on this run and state how it changed the plan.

Two stops are deliberate. Do not collapse them:

1. After §5b, stop. The user reads and approves the plan before §6 touches anything.
2. Inside §6, after committing a hook, stop. Hook config is snapshotted at session start, so the hook is not loaded here and cannot be proven here. Say a new session is needed.

Everything else runs straight through. Never ask "shall I continue?" between sections.
