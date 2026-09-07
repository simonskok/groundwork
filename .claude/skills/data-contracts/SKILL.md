---
name: data-contracts
description: The frozen data contracts - schema, VALID whitelist, capture cap, privacy rule - and the refusal rules for changing them. Read before touching api/, db/, or any answer value.
---

# Data contracts

Four contracts are frozen by owner decision of 2026-09-07. They change only on Simon's
explicit instruction, and the change edits the contract's source file in the same
commit. If a task seems to need one changed without that instruction, stop and ask -
do not work around it.

## 1. The schema (`db/schema.sql`)

Two tables: `public.stacks` (short links: id, answers jsonb, idea, created_at) and
`public.sessions` (session capture: id, answers, stack, verdict, approach, idea,
source, email, consent, email_at, created_at).

- The file is **already applied to the live Neon database**. Editing it alone changes
  nothing in production; the same SQL must also run in the Neon SQL Editor, and the
  commit message says so.
- There is no migration system. The file is the re-creation source of truth.
- The capture upsert relies on the schema's column defaults (answers `{}`, stack `[]`);
  removing a default is a breaking change even though no code names it.

## 2. The VALID whitelist (three copies)

The legal value space of the 8 answers lives in three places that must stay
byte-equivalent in meaning:

| Copy | Where |
|---|---|
| `VALID` | `api/share.js` |
| `VALID` | `api/capture.js` |
| `Q_VALUES` + `CODE`/`CODE_ORDER` | `index.html` (locate with `grep -n`) |

Verified identical on 2026-09-07. Any new question, option, or renamed value updates
all three in one commit - a miss means shared links and capture reject valid answers
with 400. A new answer key also touches `answers`, `REQUIRED`, an options block in the
HTML, and `A_LABEL` (docs/CONVENTIONS.md footgun 14 has the full list), plus one new
unique character per value in `CODE`.

## 3. The capture cap (24)

`cleanStack` in `api/capture.js` truncates the captured stack at 24 entries, and the
verified maximum result is exactly 24 cards - zero headroom. Adding a card (`mod()`
call) without raising the cap silently drops data from the moat for the heaviest
profiles. The cap raise goes in the same commit as the new card, and the sweep
(docs/CONVENTIONS.md, Testing) confirms the new maximum.

## 4. The privacy rule (the brand)

`sessions.email` and `sessions.idea` never leave the database into anything published,
sold, shared, or handed to a vendor. Aggregates are built from `answers` + `stack`
only; `db/insights.sql` is written so the safe query is the easy one. Refuse any task
that asks for an export, report, or dataset containing email or idea text, and say why.
Email is written only on explicit opt-in (`consent = true`), in its own column, with
its own timestamp.

## Degrade-clean, the adjacent invariant

Both handlers return 501 when `DATABASE_URL` (or its 3 accepted aliases, same order in
both files) is unset, and the frontend hides the feature silently. No change may make
the no-key path look broken or take the deterministic advisor down with it. Env is read
at call time inside functions, never at module scope - tests depend on this.
