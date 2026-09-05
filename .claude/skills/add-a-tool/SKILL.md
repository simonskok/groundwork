---
name: add-a-tool
description: Add a tool or a recommendation card to Groundwork without silently breaking the compare table, the counterfactuals, or the capture data.
---

# add-a-tool

Everything here is registry work in `index.html`. `grep -n` for each target first; the line
numbers in `docs/` are approximate.

## Adding a tool

1. **One entry in `TOOLS`**, keyed by a new lowercase id. Required shape, matching its
   neighbours exactly:
   - facts: `name`, `stage`, `what`, `cost`, `lockin`, `checked:CHECKED`
   - `weight` 1-5: how much operating effort it demands, not how powerful it is
   - `pros` and `cons`: short arrays, plain language
   - `against`: why it loses, keyed by the founder's goal, with `any` as the fallback
2. **Its id in the right `COMPETES` list.** That is what makes it show up in the compare table
   and in every "options it beat" line, automatically.
3. Nothing else. Do not write a why-not line into a card - put it in `against` so it appears
   everywhere that tool competes.

Keep the set curated: 3-5 real options per decision. Kubernetes, service meshes, Terraform,
Kafka, Prometheus, data warehouses and CI beyond push-to-deploy are deliberately absent.
Adding one of those is a positioning change, not a data change - ask first.

## Adding a card (a `mod()` call in `recommend()`)

`mod(role, name, why, badge, chosenId, extraAlts)`

1. **The `role` string must be a key in `ROLE2STAGE`.** Miss it and the card silently gets
   `stage:""`, falls into the `build` layer, and loses its counterfactual and its compare
   button. Nothing throws.
2. **If the card stands for several tools, `chosenId` must be an array**, e.g.
   `["framer","webflow"]`. Pass a string and the card lists its own other half among the
   options it beat.
3. **`badge:"core"` means the minimum that gets you live.** Nothing else earns it. With 26
   decisions it is easy to badge everything core and produce the wall of "Start here" cards
   this product exists to refuse.
4. **Raise the capture cap in the same commit.** `cleanStack` truncates at 24
   (`api/capture.js:63`) and the verified maximum result is exactly 24 cards. Zero headroom:
   the next card starts silently dropping data from the moat.

## Adding a whole decision

Usually `COMPETES` + `decide()` + `LAYER_OF` + `ROLE2STAGE` + a `mod()` call, and **not**
`STAGES`. Adding to `STAGES` adds a tentacle to the canvas, which only labels chosen nodes,
so it crowds the picture without adding any feeling.

## Adding a question or an option value

Five places in the frontend - `answers`, `REQUIRED`, the `.opts[data-q]` block in the HTML,
`CODE`/`CODE_ORDER`, and `Q_VALUES`/`A_LABEL` - **plus both backend copies of `VALID`**
(`api/share.js` and `api/capture.js`). Miss a backend copy and shared links and capture start
rejecting valid answers with 400. Miss `Q_VALUES` and counterfactuals silently stop
considering that question.

## Before you call it done

`npm test`, then sweep the engine per `docs/CONVENTIONS.md`, then open `index.html` in a
browser and confirm the new card renders with its alternatives and its counterfactual.
