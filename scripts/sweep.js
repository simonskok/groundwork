// Groundwork - the headless engine sweep.
//
// Runs decide()/recommend() over every legal answer combination with no browser
// and no DOM, and fails if an engine invariant broke. This is the only automated
// check that covers index.html; nothing else does.
//
//   node scripts/sweep.js            run the gates, print the numbers
//   node scripts/sweep.js --json     same, plus a machine-readable summary line
//
// Exit code 0 = every gate passed. Non-zero = at least one gate failed, and the
// failing gate is named. It gates rather than reports, on purpose: a check that
// always exits 0 stops being run.
//
// HOW IT READS index.html
// The previous recipe (docs/CONVENTIONS.md) sliced the file by absolute line
// numbers - `sed -n '356,1369p'` - and broke the moment the file grew. It now
// extracts between the SWEEP-START and SWEEP-END marker comments, so the region
// moves with the file. If a marker is missing this script fails loudly instead
// of evaluating half a file.
//
// The extracted region is the registries plus decide() and recommend(). It must
// stay DOM-free; `window.matchMedia` is the one browser API it touches and is
// stubbed below.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");
const CAPTURE = path.join(ROOT, "api", "capture.js");

// The now/later split has a documented ceiling: "Start here" must stay the
// minimum that gets you live. CLAUDE.md puts the line at about 12 mean now-cards
// and says to demote something past it. 12.5 is that rule made checkable.
const NOW_MEAN_CEILING = 12.5;

function fail(msg) {
  console.error("FAIL: " + msg);
  process.exitCode = 1;
}

/* ---------- Load the engine ------------------------------------------------ */

function loadEngine() {
  const src = fs.readFileSync(INDEX, "utf8");
  const start = src.indexOf("/* SWEEP-START");
  const end = src.indexOf("/* SWEEP-END");
  if (start < 0) throw new Error("SWEEP-START marker not found in index.html");
  if (end < 0) throw new Error("SWEEP-END marker not found in index.html");
  if (end < start) throw new Error("SWEEP-END appears before SWEEP-START in index.html");

  const region = src.slice(src.indexOf("*/", start) + 2, end);
  const sandbox = {
    window: { matchMedia: function () { return { matches: false }; } },
    console: console
  };
  vm.createContext(sandbox);
  vm.runInContext(region, sandbox, { filename: "index.html#engine" });

  const need = ["decide", "recommend", "TOOLS", "COMPETES", "STAGES", "LAYERS",
                "ROLE2STAGE", "LAYER_OF", "Q_VALUES", "CHECKED", "goalKeys"];
  const missing = need.filter((k) => sandbox[k] === undefined);
  if (missing.length) {
    throw new Error("engine region is missing: " + missing.join(", ") +
                    " - has a marker moved past a declaration?");
  }
  return { engine: sandbox, lines: region.split("\n").length };
}

// The capture cap is a frozen contract (api/capture.js, cleanStack). Read it
// rather than restating it, so the sweep gates the real number.
function captureCap() {
  const m = fs.readFileSync(CAPTURE, "utf8").match(/s\.slice\(0,\s*(\d+)\)/);
  if (!m) throw new Error("could not read the capture cap from api/capture.js");
  return Number(m[1]);
}

/* ---------- The combination space ------------------------------------------ */

function allCombos(Q_VALUES) {
  const keys = Object.keys(Q_VALUES);
  let rows = [{}];
  keys.forEach((k) => {
    const next = [];
    rows.forEach((r) => Q_VALUES[k].forEach((v) => {
      const c = Object.assign({}, r); c[k] = v; next.push(c);
    }));
    rows = next;
  });
  return rows;
}

/* ---------- The sweep ------------------------------------------------------ */

function sweep(E) {
  const combos = allCombos(E.Q_VALUES);
  const s = {
    combos: combos.length, cards: 0, min: Infinity, max: 0, maxAnswers: null,
    now: 0, nowMax: 0, noAlts: [], noStage: [], noLayer: [], seenRole: {}, seenStage: {}
  };

  combos.forEach((a) => {
    const r = E.recommend(a, "");
    const n = r.mods.length;
    s.cards += n;
    if (n < s.min) s.min = n;
    if (n > s.max) { s.max = n; s.maxAnswers = a; }

    let now = 0;
    r.mods.forEach((m) => {
      if (m.badge !== "later") now++;
      s.seenRole[m.role] = (s.seenRole[m.role] || 0) + 1;
      if (!m.alts || !m.alts.length) s.noAlts.push(m.role);
      const stage = E.ROLE2STAGE[m.role];
      if (!stage) { s.noStage.push(m.role); return; }
      s.seenStage[stage] = true;
      if (!E.LAYER_OF[stage]) s.noLayer.push(m.role + " -> " + stage);
    });
    s.now += now;
    if (now > s.nowMax) s.nowMax = now;
  });

  s.cardMean = s.cards / s.combos;
  s.nowMean = s.now / s.combos;
  return s;
}

/* ---------- Registry integrity (a card is not the only thing that can rot) -- */

function registryChecks(E) {
  const ids = Object.keys(E.TOOLS);
  const inCompetes = {};
  Object.keys(E.COMPETES).forEach((st) =>
    E.COMPETES[st].forEach((id) => { inCompetes[id] = true; }));

  return {
    tools: ids.length,
    stages: E.STAGES.length,
    decisions: Object.keys(E.COMPETES).length,
    layers: E.LAYERS.length,
    orphanTools: ids.filter((id) => !inCompetes[id]),
    ghostCompetes: Object.keys(inCompetes).filter((id) => !E.TOOLS[id]),
    staleField: ids.filter((id) => !E.TOOLS[id].checked),
    noAgainstAny: ids.filter((id) => !E.TOOLS[id].against || !E.TOOLS[id].against.any)
  };
}

// Not a gate - a tracked number. `against` keyed by the founder's goal is the
// product's reason to exist; `against.any` is the generic fallback. This reports
// how much of what a founder actually reads is goal-specific.
function goalCoverage(E) {
  const GOALS = ["cost", "scale", "speed", "nontech", "dev"];
  const ids = Object.keys(E.TOOLS);
  const perGoal = {};
  GOALS.forEach((g) => {
    perGoal[g] = ids.filter((id) => E.TOOLS[id].against[g] !== undefined).length;
  });
  const anyOnly = ids.filter((id) =>
    Object.keys(E.TOOLS[id].against).filter((k) => k !== "any").length === 0);

  // Render-time: of every alternative line a founder is shown, how many came
  // from a goal override rather than the fallback?
  const byName = {};
  ids.forEach((id) => { byName[E.TOOLS[id].name] = E.TOOLS[id]; });
  let shown = 0, specific = 0, fallback = 0, extra = 0;
  allCombos(E.Q_VALUES).forEach((a) => {
    E.recommend(a, "").mods.forEach((m) => (m.alts || []).forEach((alt) => {
      shown++;
      const t = byName[alt[0]];
      if (!t) { extra++; return; }
      if (alt[1] === t.against.any) fallback++; else specific++;
    }));
  });

  return { total: ids.length, perGoal: perGoal, anyOnly: anyOnly.length,
           shown: shown, specific: specific, fallback: fallback, extra: extra };
}

/* ---------- Run ------------------------------------------------------------ */

function pct(n, d) { return d ? (n / d * 100).toFixed(1) + "%" : "-"; }

function main() {
  const loaded = loadEngine();
  const E = loaded.engine;
  const cap = captureCap();
  const s = sweep(E);
  const reg = registryChecks(E);
  const cov = goalCoverage(E);

  console.log("Groundwork engine sweep");
  console.log("  engine region  : " + loaded.lines + " lines between the markers");
  console.log("  registries     : " + reg.tools + " tools, " + reg.decisions + " decisions, " +
              reg.stages + " canvas stages, " + reg.layers + " layers, checked " + E.CHECKED);
  console.log("");
  console.log("  combinations   : " + s.combos);
  console.log("  cards          : mean " + s.cardMean.toFixed(2) + "  min " + s.min + "  max " + s.max);
  console.log("  badged now     : mean " + s.nowMean.toFixed(2) + "  max " + s.nowMax);
  console.log("  capture cap    : " + cap + " (api/capture.js) - headroom " + (cap - s.max));
  console.log("");
  console.log("  goal-specific reasoning (report, not a gate)");
  console.log("    tools with a goal override : " + (cov.total - cov.anyOnly) + "/" + cov.total +
              " (" + pct(cov.total - cov.anyOnly, cov.total) + ")");
  Object.keys(cov.perGoal).forEach((g) => {
    console.log("      against." + g.padEnd(8) + cov.perGoal[g] + "/" + cov.total +
                "  " + pct(cov.perGoal[g], cov.total));
  });
  console.log("    lines rendered             : " + cov.shown);
  console.log("      goal-specific            : " + cov.specific + "  " + pct(cov.specific, cov.shown));
  console.log("      generic \"any\" fallback   : " + cov.fallback + "  " + pct(cov.fallback, cov.shown));
  console.log("      card-supplied extra      : " + cov.extra + "  " + pct(cov.extra, cov.shown));
  console.log("");

  // --- gates ---
  if (s.noAlts.length) fail(s.noAlts.length + " card renders had no alternatives, e.g. " + s.noAlts[0]);
  if (s.noStage.length) fail("role missing from ROLE2STAGE: " + [...new Set(s.noStage)].join(", "));
  if (s.noLayer.length) fail("stage missing from LAYER_OF: " + [...new Set(s.noLayer)].join(", "));
  if (s.max > cap) {
    fail("max result is " + s.max + " cards but api/capture.js truncates at " + cap +
         " - raise the cap in this commit or capture silently drops data");
  }
  if (s.nowMean > NOW_MEAN_CEILING) {
    fail("mean \"Start here\" cards is " + s.nowMean.toFixed(2) + ", over the " +
         NOW_MEAN_CEILING + " ceiling - demote something to later");
  }
  if (reg.orphanTools.length) fail("TOOLS entries in no COMPETES list: " + reg.orphanTools.join(", "));
  if (reg.ghostCompetes.length) fail("COMPETES ids with no TOOLS entry: " + reg.ghostCompetes.join(", "));
  if (reg.staleField.length) fail("TOOLS entries with no `checked` stamp: " + reg.staleField.join(", "));
  if (reg.noAgainstAny.length) fail("TOOLS entries with no `against.any` fallback: " + reg.noAgainstAny.join(", "));

  if (process.argv.indexOf("--json") >= 0) {
    console.log("JSON " + JSON.stringify({
      combos: s.combos, cardMean: Number(s.cardMean.toFixed(2)), cardMin: s.min, cardMax: s.max,
      nowMean: Number(s.nowMean.toFixed(2)), nowMax: s.nowMax, cap: cap,
      tools: reg.tools, decisions: reg.decisions, stages: reg.stages, layers: reg.layers,
      goalSpecificPct: Number((cov.specific / cov.shown * 100).toFixed(1))
    }));
  }

  console.log(process.exitCode ? "SWEEP FAILED" : "All gates passed.");
  if (!process.exitCode) {
    console.log("Heaviest profile (" + s.max + " cards): " + JSON.stringify(s.maxAnswers));
  }
}

main();
