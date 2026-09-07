---
description: Verify the definition of done before anything is called finished.
---

Check the three conditions in CLAUDE.md's definition of done against the current change, and
report each one as met, not met, or not applicable, with the evidence. Do not claim a
condition is met without checking it.

1. **`npm test` green.** Run it (`npm install` first if `node_modules/` is missing). Show the
   real counts. Skipped live tests are correct, not failures.

2. **Docs updated in the same commit.** Look at `git diff` and `git status`. If the change
   touched any of these, the matching doc must be updated in the same commit:
   - a new card or a new tool -> CLAUDE.md counts, and the capture cap at `api/capture.js:63`
     raised if a card was added (the verified maximum is exactly 24 and the cap is 24)
   - a new question or option value -> both `VALID` copies (`api/share.js`, `api/capture.js`)
     and the frontend `CODE` map, all three
   - a new domain term -> CONTEXT.md
   - a changed env var -> `.env.example`, ENVIRONMENT.md, and the CLAUDE.md credentials table
   - a changed architecture or flow -> the relevant file in `docs/`, README.md, HANDOFF.md

3. **Opened in a browser.** Ask whether `index.html` was opened and the changed path
   exercised by hand. If it was not, say the change is not done. There is no frontend test
   coverage and no build step, so this is the only check that catches a broken page.

Then check the locked rules were not violated: `index.html` still one file, no pick derived
outside `decide()`, no modern JS syntax introduced, canvas seed unchanged. And report any em
dash in the diff.
