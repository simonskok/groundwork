// Groundwork — session capture (Vercel serverless function, Neon Postgres).
// Banks each completed run as a data point: what the founder is building, the
// answers they gave, and the stack they were recommended. This is the raw
// material for the aggregate "what founders build" map — the defensible asset.
//
// Two phases, one endpoint (both upsert on the client-generated `sid`):
//   POST { sid, answers, stack, verdict, approach, idea, source }   → insert the anonymous session
//   POST { sid, email, consent:true }                               → attach an opted-in email to it
//
// PRIVACY BY DESIGN:
//   - Sessions are anonymous. No cookies, no IP, no fingerprint stored.
//   - `email` is written ONLY when consent is true, and lives in its own column.
//   - The sellable output is AGGREGATE (see db/insights.sql) — built from answers
//     + stack, never from email or raw idea text. Keep it that way.
//
// If DATABASE_URL is absent it returns 501 and the client no-ops silently.
//
// Env: DATABASE_URL (set automatically by the Vercel↔Neon integration).
// Table: see db/schema.sql (public.sessions).

const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");

function connString() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL ||
         process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || "";
}

const VALID = {
  type: ["website", "webapp", "marketplace", "aitool", "content", "internal"],
  accounts: ["yes", "no"],
  pay: ["yes", "later", "no"],
  heavy: ["yes", "no"],
  ai: ["yes", "no"],
  realtime: ["yes", "no"],
  comfort: ["nontech", "some", "dev"],
  priority: ["speed", "cost", "scale"]
};

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 2e5) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}

function cleanAnswers(a) {
  if (!a || typeof a !== "object") return null;
  const out = {};
  for (const k of Object.keys(VALID)) {
    if (!VALID[k].includes(a[k])) return null;
    out[k] = a[k];
  }
  return out;
}

// [{role, pick}] → sanitized, capped. Roles/picks are the sellable signal.
function cleanStack(s) {
  if (!Array.isArray(s)) return [];
  return s.slice(0, 24).map((m) => ({
    role: String((m && m.role) || "").slice(0, 60),
    pick: String((m && m.pick) || "").slice(0, 80)
  })).filter((m) => m.role && m.pick);
}

function validSid(v) {
  const s = String(v || "");
  return /^[a-z0-9-]{8,40}$/i.test(s) ? s : null;
}
function newSid() { return crypto.randomUUID(); }

function validEmail(v) {
  const e = String(v || "").trim().slice(0, 200);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

module.exports = async (req, res) => {
  const conn = connString();
  if (!conn) return res.status(501).json({ error: "not_configured", detail: "DATABASE_URL is not set." });

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const sql = neon(conn);
    const body = await readBody(req);
    const sid = validSid(body.sid) || newSid();

    // --- Phase 2: attach an opted-in email to an existing session ---
    if (body.email !== undefined) {
      const email = validEmail(body.email);
      if (!email) return res.status(400).json({ error: "invalid_email" });
      if (body.consent !== true) return res.status(400).json({ error: "consent_required" });
      await sql`
        insert into public.sessions (id, email, consent, email_at)
        values (${sid}, ${email}, true, now())
        on conflict (id) do update set
          email = excluded.email, consent = excluded.consent, email_at = excluded.email_at
      `;
      return res.status(200).json({ ok: true, sid });
    }

    // --- Phase 1: anonymous session record ---
    const answers = cleanAnswers(body.answers);
    if (!answers) return res.status(400).json({ error: "invalid_answers" });
    const stack = cleanStack(body.stack);
    const verdict = String(body.verdict || "").slice(0, 200);
    const approach = String(body.approach || "").slice(0, 200);
    const idea = String(body.idea || "").slice(0, 800);
    const source = String(body.source || "web").slice(0, 40);
    await sql`
      insert into public.sessions (id, answers, stack, verdict, approach, idea, source)
      values (${sid}, ${JSON.stringify(answers)}::jsonb, ${JSON.stringify(stack)}::jsonb,
              ${verdict}, ${approach}, ${idea}, ${source})
      on conflict (id) do update set
        answers = excluded.answers, stack = excluded.stack, verdict = excluded.verdict,
        approach = excluded.approach, idea = excluded.idea, source = excluded.source
    `;
    return res.status(200).json({ ok: true, sid });
  } catch (e) {
    return res.status(502).json({ error: "db_error", detail: String((e && e.message) || e).slice(0, 300) });
  }
};
