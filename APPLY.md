# APPLY.md - putting the foundation into groundwork

Thirteen files. Two are edits of existing files (CLAUDE.md, HANDOFF.md), one is a
deletion, the rest are new.

```
CLAUDE.md                                  replace existing (edited in place - see below)
HANDOFF.md                                 replace existing (trimmed - duplication now points at CLAUDE.md)
CONTEXT.md                                 new
ENVIRONMENT.md                             new
APPLY.md                                   new (this file; optional to commit, useful for the first session)
.claude/settings.json                      new
.claude/skills/data-contracts/SKILL.md     new
.claude/skills/engine-change/SKILL.md      new
.claude/skills/run-tests/SKILL.md          new
.claude/skills/verify-live/SKILL.md        new
.claude/commands/test.md                   new
.claude/commands/done-check.md             new
.claude/agents/code-reviewer.md            new
scripts/cloud_setup.sh                     new (must be executable: chmod +x)
CLAUDE_FOUNDATION_SETUP_groundwork.md      DELETE (superseded by this foundation)
```

What changed in the two edited files, so the diff is quick to review:

- **CLAUDE.md** - everything you ratified is untouched except: the section-boundary
  line numbers in "Where things live" updated to the current file (CSS 13-345, HTML
  346-455, JS 456-2431); a STALE warning added under the docs pointers (the index was
  built at 2024 lines, the file is 2431); Fraunces added to the visual identity line
  (it is in the code, the line omitted it). Appended at the end: Frozen contracts,
  Definition of done, Domain language pointer, Session foundation.
- **HANDOFF.md** - sections 1, 3 (tree), 4 (variable table), 5 (privacy paragraph),
  10 and 11 now point at CLAUDE.md or the skills instead of repeating them. All
  deployment facts unique to HANDOFF.md (URLs, Vercel account/team, storage steps,
  the live checks, history, next steps) are unchanged.

## How to apply

1. GitHub website: Add file > Upload files, preserving the exact folder paths above,
   plus deleting CLAUDE_FOUNDATION_SETUP_groundwork.md. Commit to main with message
   `foundation: groundwork 2026-09-07`. Or in a Claude Code session on this repo:
   paste the files and instruct exactly: "Save these files at exactly these paths.
   Delete CLAUDE_FOUNDATION_SETUP_groundwork.md. Change nothing else. Do not reformat,
   do not improve, do not create any other file. One commit:
   foundation: groundwork 2026-09-07."
2. Make the script executable: in a session, `chmod +x scripts/cloud_setup.sh`, in the
   same commit (GitHub web upload does not set the bit).
3. One-time, in the claude.ai/code environment selector for this repo: pick a Node 22
   base. Network: the default Trusted level is enough (`registry.npmjs.org` only).

## First session after merging - verification only, no feature work

1. `node -v` - expect `v22.x`. If not, fix the environment first.
2. `npm install` should already have run via the SessionStart hook; confirm
   `node_modules/@neondatabase/serverless` exists.
3. `npm test` - expect 15 tests: 12 pass, 3 skip (live tests). This converts the gate
   status from UNKNOWN to verified. If the counts differ, report the exact output
   verbatim - do not adjust any doc to match without saying so.
4. Run `npm run sweep` - expect 2592 combinations, mean 17.70 cards, max 24, and
   "All gates passed". This verifies the zero-headroom claim behind the capture-cap rule.
   (Done 2026-09-07: the sweep is now `scripts/sweep.js`, not the line-slice recipe this
   checklist originally pointed at.)
5. `/done-check` once, to see the command execute.
6. If anything fails, fix the environment or report the failing contract; do not start
   feature work on an unverified foundation.

## Decisions encoded (yours, 2026-09-07)

- Workflow frozen: direct to main, no branches, ask before every push.
- Four data contracts frozen: db/schema.sql, the VALID whitelist (3 copies), the
  capture cap of 24, the email/idea privacy rule.
- Node 22 is the session base.
- The docs/ index is recorded as stale; the first big index.html change re-generates
  it. I did not re-index from chat - a session with the repo in hand does it better.
- CLAUDE_FOUNDATION_SETUP_groundwork.md deleted as superseded; HANDOFF.md kept,
  trimmed to point instead of repeat.
- Definition of done as written in CLAUDE.md (your confirmation of 2026-09-07).

## What remained UNKNOWN

- Gate status: `npm test` results (12 pass / 3 skip is the repo's documented claim,
  last confirmed by a human 2026-09-04; not runnable from the authoring chat).
- The sweep numbers (2592 / mean 17.7 / max 24 / mean 12.0 now): documented in
  docs/CONVENTIONS.md, not re-run from chat. Step 4 above verifies the max.
- Whether the chosen Node 22 environment actually applies to a fresh session
  (ENVIRONMENT.md, Known snags): step 1 above verifies.
- Which env vars are currently set in Vercel (AI layer on or off): checkable only in
  the Vercel dashboard, not from the repo.
- Whether `db/schema.sql` still matches the live Neon database exactly (it is the
  documented source of truth; drift is possible in principle): comparable only against
  the live DB.

Nothing in these files was invented: every rule traces to a repo file (CLAUDE.md,
docs/CONVENTIONS.md, api/*.js, db/*.sql, package.json, index.html, HANDOFF.md) or to
your answers of 2026-09-07. Where verification needed a live run, the files say
UNKNOWN and this checklist converts it.
