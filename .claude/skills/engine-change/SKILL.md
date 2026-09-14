---
name: engine-change
description: How to add or change tools, cards, stages and questions in the recommendation engine without breaking its invariants. Read before touching decide(), recommend(), TOOLS, COMPETES or the canvas.
---

# Engine changes

The engine lives in one `<script>` block in `index.html`. Line numbers drift constantly;
locate every symbol with `grep -n` before editing, never from a doc or from memory.

## The one-brain rule

`decide()` is the single source of truth for every pick. `recommend()`,
`graphTargets()`, `renderSpinKit()` and `openCompare()` read from it. Never re-derive a
pick anywhere - three copies of these rules is the exact bug that once let the spin-up
panel say "open Supabase" while the card above recommended Neon. If you need a pick
somewhere new, call `decide(answers)` and read from it.

`decide()` must stay pure and cheap: `counterfactual()` re-enters it about 20 times per
card, so one result runs it around 350 times. No fetches, no DOM reads.

## Adding a tool

One entry in `TOOLS` (facts: `what`, `cost`, `lockin`, `checked`; judgement: `against`
keyed by goal with `any` fallback) + its id in `COMPETES`. It then appears in the
compare table and every "options it beat" list automatically. Rules:

- Set `checked` to the current month. Costs are shapes, not exact cents. Re-check any
  fact older than about 6 months while you are there.
- Why-not reasoning goes in the registry (`against`), never hand-written into a card.
- Kubernetes-class material (service meshes, Terraform, Kafka, warehouses, heavy CI) is
  deliberately absent. Adding it is a positioning change - stop and ask.

## Adding a card (a `mod()` call in `recommend()`)

- Its `role` string must be added to `ROLE2STAGE`, or it silently falls into the build
  layer with no counterfactual and no compare button. No error is thrown.
- A card standing for several tools passes an array of ids as `chosenId`, or it lists
  itself among the options it beat.
- The capture cap (24) has zero headroom - raise it in the same commit
  (see data-contracts skill).
- Watch the now/later split: "Start here" must stay the minimum that gets you live.
  Sweep mean is about 12 now-cards and `npm run verify` fails above 12.5; past that,
  demote something to later rather than waiting for the gate.

## Adding a canvas stage vs a decision

`STAGES` (16) is the canvas; `COMPETES` (26) is the decision set. A new decision
usually means `COMPETES` + `decide()` + `LAYER_OF` + `ROLE2STAGE` + a `mod()` call,
and NOT `STAGES` - the canvas only labels chosen nodes, so extra tentacles crowd it
without adding feeling. The newer founder-facing decisions (cms, glue, support,
marketing, forms, legal, uptime, backup) are cards only, on purpose.

- `needs` on a stage is the trigger (when it settles on the canvas), deliberately
  smaller than the true dependency set. Widening it is technically more correct and
  ruins the untangling.
- Nothing may be lit before the first answer: `graphTargets()` returns early at zero
  answers. That opening is the "trapped" half of the arc.
- The canvas seed is fixed; changing it changes the product's signature image.
- Caption counts are derived by `updateCaption()` from `NODES.length`/`STAGES.length`.
  Never reintroduce a literal count.

## Adding a question or option

That is a VALID-whitelist change - see the data-contracts skill. Frontend alone:
`answers`, `REQUIRED`, an options block in the HTML, `CODE`/`CODE_ORDER`,
`Q_VALUES`/`A_LABEL`. Miss `Q_VALUES` and counterfactuals silently ignore the question.

## Style and safety inside index.html

- ES5 only: `var`, `function(){}`, no classes, no modules, no async/await. Two existing
  exceptions (`fetch`, `crypto.randomUUID` with fallback); add no more without a
  fallback. Match the compact formatting around you.
- Everything is a global; check for name collisions before adding a top-level `var`.
- All interpolated user or model text passes through an escaper (`esc`, `escHtml`,
  `escAttr`); `mdBold` only ever after `escHtml`. Engine-authored prose with intentional
  `<b>` markup must never be built from user input.
- The canvas reads CSS custom properties every frame; never hardcode a hex there.
- No `console.log` in production code - there is no logging, client or server.

## After any engine change

`npm run verify` - the tests, then the sweep over all 2592 combinations. It asserts that
every card has alternatives and a layer, that every role is in `ROLE2STAGE`, that the max
result still fits the capture cap, and that the answer space matches in all four places
that hold it. Exit 0 or the commit is not ready.

It prints the numbers, so read them from the run rather than from here: today mean 17.7
cards, max 24, mean 12.0 now, max 16. Rendering has no automated test - also open the page
and look at it.
