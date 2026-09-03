-- Groundwork — the aggregate "map" queries (Neon Postgres).
-- Run any of these in Neon Console → SQL Editor. This is the SELLABLE / SHAREABLE
-- output: what founders are building and which tools win. It is built ONLY from
-- anonymous answers + stack — never from email or raw idea text. That is what
-- keeps it GDPR-clean and keeps the honesty brand intact. Do not export the
-- `email` or `idea` columns into anything you publish or hand a vendor.

-- 1. Volume + funnel: how many sessions, how many opted in.
select
  count(*)                                            as sessions,
  count(*) filter (where consent) as emails_opted_in,
  round(100.0 * count(*) filter (where consent) / nullif(count(*),0), 1) as opt_in_pct,
  min(created_at)::date as first_session,
  max(created_at)::date as last_session
from public.sessions;

-- 2. What kind of thing are founders building? (the demand map)
select answers->>'type' as app_kind, count(*) as n,
       round(100.0 * count(*) / sum(count(*)) over (), 1) as pct
from public.sessions
group by 1 order by n desc;

-- 3. TOOL SHARE — the number a vendor pays for.
--    "Across N sessions, tool X appears in Y% of recommended stacks."
select
  s.pick as tool,
  count(distinct sess.id) as in_stacks,
  round(100.0 * count(distinct sess.id) / nullif((select count(*) from public.sessions),0), 1) as pct_of_sessions
from public.sessions sess,
     lateral jsonb_to_recordset(sess.stack) as s(role text, pick text)
group by s.pick
order by in_stacks desc;

-- 4. Tool share for ONE role (e.g. which database wins).
--    Change the role filter to: 'Database', 'Frontend', 'Payments', 'Hosting', etc.
select s.pick as tool, count(*) as n,
       round(100.0 * count(*) / sum(count(*)) over (), 1) as pct
from public.sessions sess,
     lateral jsonb_to_recordset(sess.stack) as s(role text, pick text)
where s.role ilike '%database%'
group by 1 order by n desc;

-- 5. Segment cut: what a specific founder type is told to use.
--    (e.g. marketplaces that will charge money) — great for a targeted vendor pitch.
select s.role, s.pick, count(*) as n
from public.sessions sess,
     lateral jsonb_to_recordset(sess.stack) as s(role text, pick text)
where sess.answers->>'type' = 'marketplace'
  and sess.answers->>'pay' = 'yes'
group by s.role, s.pick
order by s.role, n desc;

-- 6. Founder profile mix (technical comfort, will-they-charge, wants-AI).
select
  answers->>'comfort'  as comfort,
  answers->>'pay'      as will_charge,
  answers->>'ai'       as wants_ai,
  count(*) as n
from public.sessions
group by 1,2,3 order by n desc;

-- 7. Trend: sessions per week (is this growing?).
select date_trunc('week', created_at)::date as week, count(*) as sessions
from public.sessions
group by 1 order by 1;

-- 8. Your opted-in list (PRIVATE — for you only, never resold).
--    select email, email_at, answers->>'type' as building
--    from public.sessions where consent and email is not null order by email_at desc;
