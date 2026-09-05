---
name: run-tests
description: Run Groundwork's test suite correctly and report what it does and does not cover.
---

# run-tests

There is no build step in this repo. `npm test` is the only automated check that exists.

## Steps

1. If `node_modules/` is missing, run `npm install` first. The tests import
   `@neondatabase/serverless`, so they fail without it. This is expected on a fresh clone.
2. Run `npm test` (which is `node --test`).
3. To run one file while iterating: `node --test test/capture.test.js` or
   `node --test test/tailor.test.js`.
4. Report per file: which suites passed, which failed, and how many were skipped.

## What is skipped, and why that is correct

Three tests are gated on `RUN_LIVE=1` plus a real model key and skip by default, so a normal
run never touches the network. To include them: `npm run test:live`. That uses POSIX
env-prefix syntax and will not work in PowerShell - set the variables separately there.
A skipped live test is not a failure. Do not report it as one.

## What this does not cover - say so every time

The suite covers `api/capture.js` and `api/tailor.js` only. `api/share.js` has no tests, and
**no frontend code is tested at all** - not `decide()`, not `recommend()`, not any rendering.
A green `npm test` says nothing about whether `index.html` still works.

So after any frontend change, opening `index.html` in a browser and exercising the changed
path by hand is part of the definition of done, not an optional extra.

## After a change to decide() or recommend()

Sweep the engine headlessly as well. The recipe is in `docs/CONVENTIONS.md` under Testing:
extract the DOM-free region of `index.html`, drive it from Node over all 2592 answer
combinations, and check the card counts have not drifted from mean 17.7 / max 24 cards and
mean 12.0 / max 16 "now" cards. A rising "now" mean means the product has started upselling.
