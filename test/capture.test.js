// Groundwork — offline tests for the session capture function (api/capture.js).
// These exercise the method + validation guards, which all return BEFORE any
// network call, so no database and no DATABASE_URL are needed. Run: npm test

const { test } = require("node:test");
const assert = require("node:assert/strict");
const capture = require("../api/capture.js");

function mockRes() {
  return {
    statusCode: 200, headers: {}, body: undefined,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; }
  };
}
async function call(body, method, env) {
  const keys = ["DATABASE_URL", "POSTGRES_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];
  const saved = {}; for (const k of keys) saved[k] = process.env[k];
  for (const k of keys) delete process.env[k];
  for (const k of Object.keys(env || {})) process.env[k] = env[k];
  const res = mockRes();
  try { await capture(Object.assign({ method: method || "POST", body: body || {} }), res); }
  finally { for (const k of keys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } }
  return res;
}
const CONFIGURED = { DATABASE_URL: "postgres://u:p@ep-test.eu-central-1.aws.neon.tech/neondb?sslmode=require" };
const GOOD_ANSWERS = { type: "marketplace", accounts: "yes", pay: "yes", heavy: "no", ai: "no", realtime: "no", comfort: "nontech", priority: "speed" };

test("capture: no DATABASE_URL → 501 (client no-ops silently)", async () => {
  const res = await call({ answers: GOOD_ANSWERS }, "POST", {});
  assert.equal(res.statusCode, 501);
  assert.equal(res.body.error, "not_configured");
});

test("capture: GET → 405", async () => {
  const res = await call({}, "GET", CONFIGURED);
  assert.equal(res.statusCode, 405);
});

test("capture: phase-1 with bad answers → 400 (before any DB call)", async () => {
  const res = await call({ answers: { type: "not-a-real-type" } }, "POST", CONFIGURED);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, "invalid_answers");
});

test("capture: phase-2 email without consent → 400", async () => {
  const res = await call({ sid: "abcd1234", email: "a@b.com", consent: false }, "POST", CONFIGURED);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, "consent_required");
});

test("capture: phase-2 malformed email → 400", async () => {
  const res = await call({ sid: "abcd1234", email: "not-an-email", consent: true }, "POST", CONFIGURED);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, "invalid_email");
});
