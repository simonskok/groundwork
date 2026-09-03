// Groundwork — test suite for the AI tailoring function (api/tailor.js).
// Zero dependencies. Uses Node's built-in test runner (Node >= 18).
//
//   Offline (no key, no network — pure logic + HTTP guards):
//     node --test test/tailor.test.js
//     npm test
//
//   Live smoke test (really calls the provider — costs a few free-tier tokens):
//     RUN_LIVE=1 GEMINI_API_KEY=AIza... node --test test/tailor.test.js
//     RUN_LIVE=1 GROQ_API_KEY=gsk_...  node --test test/tailor.test.js
//   RUN_LIVE=1 alone auto-uses whichever key is in the environment.

const { test } = require("node:test");
const assert = require("node:assert/strict");

const tailor = require("../api/tailor.js");
const { pickProvider, extractJSON, answerSummary, buildPrompt } = tailor._internals;
const handler = tailor; // the request handler is the module's default export

// ---- tiny mock req/res so we can call the handler with no server ----
function mockRes() {
  return {
    statusCode: 200, headers: {}, body: undefined,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; }
  };
}
async function call(reqOverrides) {
  const req = Object.assign({ method: "POST", body: {} }, reqOverrides);
  const res = mockRes();
  await handler(req, res);
  return res;
}
// run a fn with a temporary env, always restored afterwards
function withEnv(vars, fn) {
  const keys = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "GROQ_API_KEY", "AI_PROVIDER", "TAILOR_MODEL"];
  const saved = {};
  for (const k of keys) saved[k] = process.env[k];
  for (const k of keys) delete process.env[k];
  for (const k of Object.keys(vars)) process.env[k] = vars[k];
  try { return fn(); }
  finally { for (const k of keys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } }
}

// ======================= OFFLINE UNIT TESTS =======================

test("extractJSON: plain, fenced, wrapped-in-prose, and garbage", () => {
  assert.deepEqual(extractJSON('{"a":1}'), { a: 1 });
  assert.deepEqual(extractJSON('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJSON('Sure! {"a":1} hope that helps'), { a: 1 });
  assert.equal(extractJSON("not json at all"), null);
  assert.equal(extractJSON(""), null);
});

test("answerSummary: empty vs populated", () => {
  assert.equal(answerSummary(null), "(none)");
  assert.equal(answerSummary({}), "");
  const s = answerSummary({ type: "web app", ai: "yes", nonsense: "ignored" });
  assert.match(s, /kind of thing=web app/);
  assert.match(s, /uses AI=yes/);
  assert.doesNotMatch(s, /nonsense/);
});

test("buildPrompt: each stage has a bounded token budget and mentions the idea", () => {
  for (const stage of ["followups", "insights", "brief"]) {
    const spec = buildPrompt({ stage, idea: "a dog-walking marketplace", answers: { type: "marketplace" } });
    assert.ok(spec.max_tokens > 0 && spec.max_tokens <= 1000, stage + " token budget");
    assert.match(spec.prompt, /dog-walking marketplace/, stage + " includes idea");
    assert.match(spec.prompt, /Return JSON/, stage + " asks for JSON");
  }
});

test("pickProvider: forcing, precedence, and none", () => {
  withEnv({}, () => assert.equal(pickProvider(), null));
  withEnv({ GEMINI_API_KEY: "x" }, () => assert.equal(pickProvider(), "gemini"));
  withEnv({ GROQ_API_KEY: "x" }, () => assert.equal(pickProvider(), "groq"));
  withEnv({ GEMINI_API_KEY: "x", GROQ_API_KEY: "y" }, () => assert.equal(pickProvider(), "gemini"));
  withEnv({ GEMINI_API_KEY: "x", GROQ_API_KEY: "y", AI_PROVIDER: "groq" }, () => assert.equal(pickProvider(), "groq"));
  withEnv({ GROQ_API_KEY: "y", AI_PROVIDER: "gemini" }, () => assert.equal(pickProvider(), null)); // forced but no key
});

test("handler: GET is rejected 405 with Allow header", async () => {
  await withEnv({ GEMINI_API_KEY: "x" }, async () => {
    const res = await call({ method: "GET" });
    assert.equal(res.statusCode, 405);
    assert.equal(res.headers.Allow, "POST");
  });
});

test("handler: no key configured returns 501 (site falls back to deterministic engine)", async () => {
  await withEnv({}, async () => {
    const res = await call({ method: "POST", body: { idea: "anything" } });
    assert.equal(res.statusCode, 501);
    assert.equal(res.body.error, "not_configured");
  });
});

test("handler: POST with a key but no idea returns 400", async () => {
  await withEnv({ GEMINI_API_KEY: "x" }, async () => {
    const res = await call({ method: "POST", body: { idea: "  " } });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, "missing_idea");
  });
});

// ======================= LIVE SMOKE TESTS =======================
// Gated on RUN_LIVE=1 + a real key in the environment. These make real API calls.

const LIVE = process.env.RUN_LIVE === "1" &&
  !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GROQ_API_KEY);

const SAMPLE = {
  idea: "an app that lets local bakeries take pre-orders and pay-ahead for next-day pickup",
  answers: { type: "marketplace", accounts: "yes", pay: "yes", comfort: "low", priority: "speed" }
};

test("LIVE followups: returns a read + questions array", { skip: !LIVE }, async () => {
  const res = await call({ method: "POST", body: Object.assign({ stage: "followups" }, SAMPLE) });
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(typeof res.body.read, "string");
  assert.ok(Array.isArray(res.body.questions));
  console.log("  read:", res.body.read);
});

test("LIVE insights: returns a title + 1..6 insight strings", { skip: !LIVE }, async () => {
  const res = await call({ method: "POST", body: Object.assign({ stage: "insights", verdict: "Start lean",
    stack: ["Frontend: Next.js", "DB: Supabase", "Payments: Stripe"] }, SAMPLE) });
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(typeof res.body.title, "string");
  assert.ok(Array.isArray(res.body.insights) && res.body.insights.length >= 1);
  console.log("  title:", res.body.title);
});

test("LIVE brief: returns a non-trivial markdown brief", { skip: !LIVE }, async () => {
  const res = await call({ method: "POST", body: Object.assign({ stage: "brief", approach: "Managed stack",
    stack: ["Frontend: Next.js", "DB: Supabase", "Payments: Stripe"] }, SAMPLE) });
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(typeof res.body.brief, "string");
  assert.ok(res.body.brief.length > 80, "brief should be substantial");
});
