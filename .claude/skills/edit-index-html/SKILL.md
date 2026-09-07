---
name: edit-index-html
description: Safely change index.html, the single 2436-line frontend file that has no build step and no direct test coverage.
---

# edit-index-html

`index.html` is the entire product. Nothing tests it and nothing compiles it, so a mistake
ships silently.

## Before editing

1. **`grep -n` for the exact target.** Never edit at a line number taken from `docs/`,
   CLAUDE.md, or a previous session. This file changes constantly and every documented line
   number is approximate.
2. **State the function you are changing** before you change it.
3. Read the block comment above it. Those comments are design rationale, not description. If
   you change the reasoning, update the comment in the same edit.

## The four things you must never do

1. **Never split the file.** It is one file so it opens straight in a browser with no build
   and no server. Its size is not a reason to break it up.
2. **Never re-derive a pick outside `decide()`.** `recommend()`, `graphTargets()`,
   `renderSpinKit()` and `openCompare()` all read from it. A second copy of a rule is what
   once let the spin-up panel say "open Supabase" while the card recommended Neon.
3. **Never modernise the style.** `var`, `function(){}`, `.then()`, globals in one script
   block. No `let`/`const`, no arrow functions, no modules, no `async`/`await`. The only
   exceptions are the two already there: `fetch` and `crypto.randomUUID()` (with a fallback).
4. **Never change the canvas seed** `mulberry32(20260902)`. It is the signature image.
5. **Never remove or move the `SWEEP-START` / `SWEEP-END` markers** without moving them
   deliberately. `scripts/sweep.js` extracts the region between them, and that region must
   stay DOM-free - new engine code goes inside it, anything touching `document` goes below
   `SWEEP-END`. This replaced a recipe that sliced the file by line number and broke.

## While editing

- Match the density of the surrounding lines. This file uses compact formatting, several
  statements per line. It is deliberate.
- Every top-level `var` is a new global. Check for a name collision before adding one.
- `$(sel)` is the only DOM helper.
- HTML is built as strings and assigned to `innerHTML`. Everything interpolated must pass
  through an escaper: `esc` inside `renderResults`, `escHtml` for model output and spin-up
  text, `escAttr` for attribute values. `mdBold` re-introduces `<b>` and must only ever run
  after `escHtml`.
- Prefer extending a lookup map (`A_LABEL`, `ID_LABEL`, `LAYER_OF`, `ROLE2STAGE`, `CODE`) to
  adding an `if`.
- No `console.log` in shipped code. There is no logging here, client or server.
- Nothing may be lit before the first answer. `graphTargets()` returns early at zero answers
  on purpose - that opening is the trapped half of the arc.
- Counts in the figure caption are derived from `NODES.length` / `STAGES.length`. Never
  reintroduce a literal.

## After editing

1. `npm test` (it will not catch a frontend mistake, but run it anyway).
2. If you touched anything between `SWEEP-START` and `SWEEP-END`, run `npm run sweep`.
   It must exit 0. Verified numbers: 2592 combinations, mean 17.70 cards, max 24,
   mean 11.97 now, max 16.
3. **Open `index.html` in a browser**, answer the eight questions, and look at the result.
   This is the only real check that exists. It is part of the definition of done.
