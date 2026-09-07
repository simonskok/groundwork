Verify the Definition of done (CLAUDE.md) before a commit to main. Check and report
each item; fail closed - if an item cannot be verified, say so rather than assuming
it passes.

1. Gates: the suite covering every touched `api/` file is green (`npm test` when in
   doubt). If `decide()` or `recommend()` changed, the headless sweep was run and its
   numbers reported.
2. Frontend: if `index.html` changed, state explicitly that it was viewed in a browser
   (or that it was not, as a failure) - it has no test coverage.
3. Contract sync: any change to answers/options updated all three VALID copies; any new
   `mod()` raised the capture cap; any schema change edited `db/schema.sql` and states
   that the same SQL must run in the Neon SQL Editor. All in this same commit.
4. Frozen contracts: no schema, whitelist, cap, privacy, or workflow change without
   Simon's explicit instruction recorded in the task.
5. Privacy: nothing in the diff exports, logs, or publishes `sessions.email` or
   `sessions.idea`.
6. Docs honesty: if `index.html` changed substantially, the freshness note in CLAUDE.md
   still tells the truth about the index; derived counts were not replaced by literals.
7. Style: new prose uses plain hyphens, no em dashes; new frontend code is ES5-style
   and matches the surrounding density; no `console.log` added.
8. Push discipline: nothing was pushed. If a push is wanted, it is a separate explicit
   question to Simon, never bundled into "done".

Report pass or fail per item, then an overall verdict: done, or not done with the
shortest path to done.
