// Groundwork — short share links (Vercel serverless function, Neon Postgres).
// POST { answers, idea }  -> { id }             saves a stack, returns a short id
// GET  ?id=<id>           -> { answers, idea }   resolves a short id
// If DATABASE_URL is absent it returns 501 and the site falls back to the
// long ?p= link (which needs no backend).
//
// Env: DATABASE_URL (set automatically by the Vercel↔Neon integration).
// Table (see db/schema.sql):
//   stacks ( id text primary key, answers jsonb, idea text, created_at timestamptz default now() )

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
    req.on("data", (c) => { raw += c; if (raw.length > 1e5) req.destroy(); });
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

function shortId() {
  const b = crypto.randomBytes(6);
  const abc = "abcdefghijkmnpqrstuvwxyz23456789"; // no ambiguous chars
  let s = "";
  for (let i = 0; i < b.length; i++) s += abc[b[i] % abc.length];
  return s;
}

module.exports = async (req, res) => {
  const conn = connString();
  if (!conn) return res.status(501).json({ error: "not_configured", detail: "DATABASE_URL is not set." });

  try {
    const sql = neon(conn);

    if (req.method === "GET") {
      const id = String((req.query && req.query.id) || "").replace(/[^a-z0-9]/gi, "").slice(0, 16);
      if (!id) return res.status(400).json({ error: "missing_id" });
      const rows = await sql`select answers, idea from public.stacks where id = ${id} limit 1`;
      if (!rows || !rows.length) return res.status(404).json({ error: "not_found" });
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.status(200).json({ answers: rows[0].answers, idea: rows[0].idea || "" });
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const answers = cleanAnswers(body.answers);
      if (!answers) return res.status(400).json({ error: "invalid_answers" });
      const idea = String(body.idea || "").slice(0, 800);
      const id = shortId();
      await sql`insert into public.stacks (id, answers, idea) values (${id}, ${JSON.stringify(answers)}::jsonb, ${idea})`;
      return res.status(200).json({ id });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    return res.status(502).json({ error: "db_error", detail: String((e && e.message) || e).slice(0, 300) });
  }
};
