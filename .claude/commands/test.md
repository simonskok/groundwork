---
description: Run every gate that exists and report per check.
---

Run Groundwork's gates and report the result of each one separately. Do not summarise them
into a single pass or fail.

1. **Build: none.** This repo has no build, bundler, minifier, typecheck or lint step.
   Report it as "none - nothing to run", and do not invent a command.
2. **Tests.** If `node_modules/` is missing, run `npm install` first, then run `npm test`.
   Report per file (`test/capture.test.js`, `test/tailor.test.js`): passed, failed, skipped.
   Skipped live tests are correct behaviour, not failures - they need `RUN_LIVE=1` and a
   model key, via `npm run test:live`.
3. **Coverage caveat.** State plainly that the suite covers `api/capture.js` and
   `api/tailor.js` only, that `api/share.js` has no tests, and that no frontend code is
   tested at all - so a green run says nothing about whether `index.html` works.

If anything failed, show the real output. Do not describe a failure in your own words only.
