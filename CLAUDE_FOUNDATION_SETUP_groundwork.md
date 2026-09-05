# CLAUDE_FOUNDATION_SETUP.md - groundwork

A one-time setup that builds this repo's Claude Code foundation, then its skills, commands, a
review subagent, and its dependency environment. Point Claude Code at this file in Plan mode. It
reads the repo, interviews you, and generates everything as a pull request. Run once. Keep for re-runs.

There is no prior context on this repo. Treat it as a cold start. Discover everything, assume nothing.

## How to run it
1. New task on this repo in claude.ai/code. Repo: groundwork only. Branch: main. Mode: Plan.
2. Paste the intro prompt (from INTRO_PROMPT.txt).
3. Approve each phase. Review and merge the PR.

## Rules that override everything
- Do not create any file except the ones the phases name. No scratch files.
- Prefer editing an existing file over creating one. If a new file seems needed, stop and ask, with a reason.
- One source of truth per fact. Never invent; if unknown, ask or write UNKNOWN.
- Plain hyphens, no em dashes. No shipping or maritime metaphors. Warm, plain language.
- Finish each phase properly. Do not skip a step.

---

## Repo context (UNKNOWN by design)
Nothing is assumed about this repo, so you do not inherit a wrong belief. In Phase 0, read any
CLAUDE.md, README, handoff, or roadmap doc first, then the tree and manifests, and build an
evidence-based picture. Do not guess from the name. House style: no em dashes, plain hyphens, no
maritime metaphors.

---

## Phase 0 - explore before asking anything
Silently, then a summary of at most 20 lines. Ask nothing yet.
1. Read any CLAUDE.md, README, handoff, or roadmap doc first, and treat it as the source of truth.
2. Read the tree, every manifest and lockfile, config, and CI. Find the language, framework,
   deployment, exact build command, and exact test command. If there are none, say so plainly.
3. Read .gitignore. List anything tracked that should not be.
4. Form a plain picture of what this repo is and does, from evidence only.
Summary must cover: what the repo appears to be, stack and entry points, exact build and test
commands (or UNKNOWN), tracked junk, and the 3 biggest risks of an agent making a mess here.
Stop for my confirmation.

## Phase 1 - interview me
Treat this as a cold start. Ask all groups in full, one at a time, adapted to Phase 0.
- A Purpose and scope: what this repo is for, who uses it, what is out of scope. Get this in my words first.
- B Architecture and boundaries: the parts, how they fit, and any stable areas that must not be reworked.
- C Invariants and do-not-touch: ask me directly; if I am unsure, propose a list from what you found for me to approve.
- D Conventions: language, framework, versions, where new code lives, the format/lint command.
- E Gates: discover the real build and test commands and confirm them with me. If none exist yet, record that honestly.
- F Definition of done: what must be true and updated to merge.
- G Domain language: the terms this project uses that an outsider would not know.
Also ask up to 5 repo-specific questions. Wait for all answers before Phase 2.

## Phase 2 - generate the foundation
From Phase 0 and my answers only. Show each for approval, then write:
1. CLAUDE.md at the root, using the template at the bottom.
2. CONTEXT.md: the domain glossary from Group G, alphabetical.
3. A repo map inside CLAUDE.md, marking do-not-edit items.
4. .claude/settings.json: permissions allowing normal work, denying force-push, history rewrite, and touching secrets.
Stop for approval. Write only approved files.

## Phase 3 - skills, commands, and a review subagent
Create committed files so every session has them. Keep each skill small and specific.
1. Skills at .claude/skills/<name>/SKILL.md. Create only the ones this repo actually needs, decided
   from Phase 0 and Phase 1, and ask before adding each. At minimum a `run-tests` skill if a test
   command exists. Each SKILL.md has YAML frontmatter with `name` and a one-line `description`, then steps.
2. Commands at .claude/commands/*.md. Create at least:
   - `/test`: run the build and tests, report per-check (only if such commands exist).
   - `/done-check`: verify the Definition of done.
3. A review subagent at .claude/agents/code-reviewer.md. It reviews the diff on two axes: does it
   follow conventions and the do-not-touch list, and does it do what the task asked. It must flag any em dashes.
Show all for approval, then write.

## Phase 4 - dependency and environment setup (so anything runnable runs in a session)
Goal: a fresh cloud session installs the toolchain and can build and test without manual steps, if
the repo has a toolchain at all.
1. Determine the exact install steps from Phase 0. If the repo has no build or tests yet, say so
   and skip creating a setup script rather than inventing one.
2. If there is a toolchain, create a committed setup script at scripts/cloud_setup.sh that installs
   it and is safe to re-run, and wire it as a SessionStart hook in .claude/settings.json.
3. Write ENVIRONMENT.md at the root: the network level needed, any environment variables, and the
   reason for each. If nothing special is needed, say the default is enough.
4. Tell me which parts are automatic and the one-time step I do in the claude.ai/code environment
   selector. Warn me that a selected environment sometimes does not apply, so the first session must
   confirm the toolchain is actually present before trusting it.
Show anything you propose to write for approval first.

## Phase 5 - verify and hand back
1. Run the build and test commands if they exist. Report pass or fail. If UNKNOWN or none, say so.
2. Echo the Definition of done in three lines or fewer.
3. List every file created or edited, nothing extra.
4. Confirm in one line that nothing was invented.
5. Leave the PR open for me to review and merge.

---

## CLAUDE.md template (fill this, never ship it empty)
```markdown
# CLAUDE.md
Read this fully before touching anything. Single source of truth for how to work here.

## What this repo is
One paragraph: purpose, who uses the output, what they judge it by, what is out of scope.

## How to work here (rules)
- Prefer editing existing files over creating new ones. Ask before adding a file, with a reason.
- One source of truth per fact. Never invent; if unsure, ask or mark UNKNOWN.
- [Project-specific hard rules discovered in the interview.]
- Plain hyphens, no em dashes, no maritime metaphors.

## Architecture and boundaries
- The parts and how they fit. Do-not-touch: [list].

## Repository map
[Short tree. One line per important item. Mark do-not-edit clearly.]

## Conventions
- Language, framework, versions, where new code lives, format/lint command.

## Gates (must pass before any change is done)
- Build: [command or "none yet"]
- Tests: [command or "none yet"]
A change is not done until every gate is green.

## Definition of done
- Build and tests green (if they exist). Docs updated. [Anything else required to merge.]

## Domain language
See CONTEXT.md. Use those terms exactly.

## What has broken before
[Short list so it is not repeated.]
```
