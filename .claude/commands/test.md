Run this repo's gates and report per check.

1. Run `node -v`. If it does not print v22, report the environment problem and continue
   only if the version still satisfies >=18 - and say so in the report.
2. Confirm `node_modules/@neondatabase/serverless` exists; if not, run `npm install`
   first (the suites import it).
3. If arguments name a file or area, run only the suite covering it
   (mapping in .claude/skills/run-tests/SKILL.md). Otherwise run `npm test`.
4. Report one line per suite: name, pass/fail/skip counts, and for failures the first
   failing assertion verbatim. 3 skips in the default run are expected (live tests).
5. Never run `npm run test:live` unless explicitly asked - it calls a real model API.
6. Do not modify any file to make a test pass without stating what the test was
   protecting and why the change is safe.
7. Remember what has no coverage: api/share.js and all of index.html. A green run says
   nothing about a frontend change.
