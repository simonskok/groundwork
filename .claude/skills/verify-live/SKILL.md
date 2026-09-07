---
name: verify-live
description: How to check the deployed Groundwork site and its functions after a push, reading the live state directly rather than assuming.
---

# Verify live

Every push to main is a production deploy, so after an approved push, verify the live
site directly. The checks below come from HANDOFF.md section 6; the live URL and the
Vercel project name are recorded there.

1. **Site up:** open the live URL - the app (canvas + 8 questions) loads, no error, no
   login.
2. **Functions deployed:** GET `<live URL>/api/tailor` - a **405** means the function is
   live (GET is not allowed). A 404 means it is missing. A POST without a key returns
   501 and the app degrades quietly - that is the designed state, not an outage.
3. **AI layer on** (only if a key is set in Vercel): an idea of 12+ characters makes
   "Read my idea" return follow-up chips.
4. **DB on** (only if `DATABASE_URL` is set): finishing a run and copying the short
   link yields a `?r=<id>` URL, not the long `?p=` one.
5. **Deploy status:** Vercel dashboard, Deployments, latest = Ready.

Rules:

- A 501 from any function is feature-not-configured, never a bug. Do not "fix" it.
- Which keys are actually set lives in Vercel, Settings, Environment Variables - check
  there (or ask Simon) instead of guessing from behavior.
- Never print an env value while checking. Names yes, values never.
- If a check fails, report exactly which numbered check failed and what came back,
  verbatim, before proposing anything.
