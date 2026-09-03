// Groundwork — AI tailoring (Vercel serverless function).
// Calls a free LLM provider to (1) ask smart follow-ups, (2) give an idea-specific
// read, (3) write a build brief. Provider-flexible: set EITHER key.
//   - GEMINI_API_KEY → Google Gemini (free tier, no card) get: https://aistudio.google.com/app/apikey
//   - GROQ_API_KEY   → Groq (Llama, fast, free)           get: https://console.groq.com/keys
// If neither is set it returns 501 and the site falls back to the deterministic engine.
//
// Optional env:
//   AI_PROVIDER   "gemini" | "groq"  (force one when both keys are present)
//   TAILOR_MODEL  model override (default: Gemini gemini-2.5-flash / Groq llama-3.3-70b-versatile)
//
// Env is read at call time (not import time) so tests and previews can set it dynamically.

function geminiKey() { return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""; }
function groqKey() { return process.env.GROQ_API_KEY || ""; }

function pickProvider() {
  const hasGemini = !!geminiKey();
  const hasGroq = !!groqKey();
  const forced = (process.env.AI_PROVIDER || "").toLowerCase();
  if (forced === "gemini") return hasGemini ? "gemini" : null;
  if (forced === "groq") return hasGroq ? "groq" : null;
  if (hasGemini) return "gemini";
  if (hasGroq) return "groq";
  return null;
}

const VOICE =
  "You are the reasoning layer of Groundwork, an honest tech-stack advisor for non-technical and " +
  "semi-technical founders. Voice: plain, human, concrete, warm, no jargon in plain sight. " +
  "Honesty is the product: be willing to say a founder needs LESS, not more. Never upsell complexity. " +
  "You reply with ONLY valid JSON — no prose, no markdown fences.";

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 1e6) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}

function extractJSON(text) {
  if (!text) return null;
  let t = String(text).trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(t); } catch {}
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch {} }
  return null;
}

const ANSWER_LABELS = {
  type: "kind of thing", accounts: "logins", pay: "charging", heavy: "heavy processing",
  ai: "uses AI", realtime: "real-time", comfort: "technical comfort", priority: "priority"
};
function answerSummary(a) {
  if (!a) return "(none)";
  return Object.keys(ANSWER_LABELS)
    .filter((k) => a[k])
    .map((k) => ANSWER_LABELS[k] + "=" + a[k])
    .join(", ");
}

function buildPrompt(body) {
  const stage = body.stage || "insights";
  const idea = String(body.idea || "").slice(0, 800);
  const ans = answerSummary(body.answers);

  if (stage === "followups") {
    return {
      max_tokens: 400,
      prompt:
        "A founder wants to build: \"" + idea + "\"\n" +
        "Their answers so far: " + ans + ".\n\n" +
        "Return JSON: {\"read\": <one short, specific sentence reflecting what you understand they're building>, " +
        "\"questions\": [ up to 2 objects {\"q\": <a short, decision-relevant follow-up question you still need answered to sharpen the stack>, " +
        "\"hint\": <optional one-line clarifier>, \"options\": [2-4 short answer chips]} ]}. " +
        "Ask only questions that would actually change the recommendation (e.g. data sensitivity, who the very first user is, expected concurrency, regulatory constraints). " +
        "If nothing important is missing, return an empty questions array."
    };
  }
  if (stage === "brief") {
    const stack = (body.stack || []).join("; ");
    return {
      max_tokens: 950,
      prompt:
        "A founder is building: \"" + idea + "\"\n" +
        "Chosen approach: " + (body.approach || "") + "\n" +
        "Chosen stack: " + stack + "\n\n" +
        "Write a build brief they can paste into an AI coding tool (Claude Code) to start. " +
        "Return JSON: {\"brief\": <markdown string>}. The markdown should contain: a one-line product summary; " +
        "**The one core action** (the single thing a user does that makes it valuable); a short **v1 scope** list " +
        "(only what serves that action) and an explicit **Not now** list; a minimal **data model** sketch " +
        "(tables + key columns for the chosen database); **First tickets** (3–5, in build order); and one honest risk. " +
        "Keep it tight and concrete to THIS idea and stack. No fluff."
    };
  }
  // insights (default)
  const stack = (body.stack || []).join("; ");
  const fu = (body.followups || []).map((f) => f.q + " → " + f.a).join("; ");
  return {
    max_tokens: 500,
    prompt:
      "A founder is building: \"" + idea + "\"\n" +
      "Answers: " + ans + (fu ? "\nFollow-ups: " + fu : "") + "\n" +
      "Verdict given: " + (body.verdict || "") + "\nStack: " + stack + "\n\n" +
      "Return JSON: {\"title\": <3-6 word title>, \"insights\": [3-4 strings]}. " +
      "Each insight is specific to THIS idea (not generic stack advice): a concrete risk, a sequencing call, " +
      "a 'you don't need X yet', or the sharpest first move. Use **bold** for the lead of each. Be honest and plain."
  };
}

// ---- provider callers: each returns { text } or { error, status } ----

async function callGroq(spec) {
  const model = process.env.TAILOR_MODEL || "llama-3.3-70b-versatile";
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "authorization": "Bearer " + groqKey(), "content-type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: spec.max_tokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: VOICE },
        { role: "user", content: spec.prompt }
      ]
    })
  });
  if (!r.ok) return { error: await r.text().catch(() => ""), status: r.status };
  const data = await r.json();
  return { text: (((data.choices || [])[0] || {}).message || {}).content || "" };
}

async function callGemini(spec) {
  const model = process.env.TAILOR_MODEL || "gemini-2.5-flash";
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) + ":generateContent";
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "x-goog-api-key": geminiKey(), "content-type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: VOICE }] },
      contents: [{ role: "user", parts: [{ text: spec.prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: spec.max_tokens,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    })
  });
  if (!r.ok) return { error: await r.text().catch(() => ""), status: r.status };
  const data = await r.json();
  const cand = (data.candidates || [])[0];
  const text = ((cand && cand.content && cand.content.parts) || []).map((p) => p.text || "").join("");
  return { text, finishReason: cand && cand.finishReason };
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const provider = pickProvider();
  if (!provider) {
    return res.status(501).json({ error: "not_configured", detail: "Set GEMINI_API_KEY or GROQ_API_KEY." });
  }

  let body;
  try { body = await readBody(req); } catch { body = {}; }
  if (!body || !String(body.idea || "").trim()) return res.status(400).json({ error: "missing_idea" });

  const spec = buildPrompt(body);

  try {
    const out = provider === "gemini" ? await callGemini(spec) : await callGroq(spec);
    if (out.error !== undefined) {
      return res.status(502).json({ error: "model_error", provider, status: out.status, detail: String(out.error).slice(0, 400) });
    }
    const parsed = extractJSON(out.text);
    if (!parsed) {
      return res.status(502).json({ error: "unparseable", provider, finishReason: out.finishReason || "", raw: String(out.text).slice(0, 400) });
    }
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(502).json({ error: "fetch_failed", provider, detail: String(e).slice(0, 200) });
  }
}

// Vercel invokes the default export as the request handler.
module.exports = handler;
// Exposed for the test suite (test/tailor.test.js). Not used by the running function.
module.exports._internals = {
  pickProvider, extractJSON, answerSummary, buildPrompt, callGroq, callGemini, geminiKey, groqKey, VOICE
};
