-- Groundwork — database schema (Neon Postgres).
-- Already applied to the Neon `groundwork` project. Kept here as the source of
-- truth / to re-create the DB elsewhere. Run in Neon Console → SQL Editor if needed.
--
-- Both serverless functions connect via DATABASE_URL (set automatically by the
-- Vercel↔Neon integration) using the database owner role, so no RLS is needed —
-- the browser never touches the database directly, only /api/* does.

-- Short share links (api/share.js)
create table if not exists public.stacks (
  id          text primary key,
  answers     jsonb not null,
  idea        text,
  created_at  timestamptz not null default now()
);

-- Session capture — the data moat (api/capture.js)
-- Privacy: rows are anonymous. `email` is written only on explicit opt-in and is
-- NEVER part of the aggregate you publish or sell. No IP / cookies stored.
create table if not exists public.sessions (
  id          text primary key,             -- client-generated session id (uuid)
  answers     jsonb not null default '{}'::jsonb,  -- the 8 questionnaire answers
  stack       jsonb not null default '[]'::jsonb,  -- [{role, pick}] recommended
  verdict     text,                         -- the headline recommendation
  approach    text,                         -- "how to build it"
  idea        text,                         -- raw idea text (NOT for resale — aggregate only)
  source      text default 'web',           -- where the session came from
  email       text,                         -- opt-in only
  consent     boolean not null default false,
  email_at    timestamptz,                  -- when the email was given
  created_at  timestamptz not null default now()
);

create index if not exists sessions_created_idx on public.sessions (created_at);
create index if not exists sessions_type_idx on public.sessions ((answers->>'type'));
