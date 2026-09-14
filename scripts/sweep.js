// Headless sweep of the recommendation engine. Exit 0 green, exit 1 red.
// Covers what `npm test` cannot reach: decide()/recommend() inside index.html.
var fs = require("fs");
var path = require("path");
var engine = require("./engine.js");

var ROOT = engine.ROOT;
var E;
try { E = engine.load(); }
catch (e) { console.error("SWEEP FAILED\n  - " + e.message); process.exit(1); }

var fails = [], notes = [];
function fail(m) { fails.push(m); }

/* ---- the whole answer space, built from Q_VALUES ----------------------- */
var QV = E.Q_VALUES;
var all = [{}];
Object.keys(QV).forEach(function (k) {
  var next = [];
  all.forEach(function (o) {
    QV[k].forEach(function (v) { var c = Object.assign({}, o); c[k] = v; next.push(c); });
  });
  all = next;
});

/* ---- frozen contract 3: the capture cap, read from cleanStack ----------- */
var capSrc = fs.readFileSync(path.join(ROOT, "api", "capture.js"), "utf8");
var fn = capSrc.indexOf("function cleanStack");
// Anchored on the stack argument itself. cleanStack also truncates role and pick,
// so a looser regex would read 60 or 80 as the cap after any reorder - and a cap
// larger than the real one is a gate that never fires. A rename makes this miss
// and fail closed, which is the right direction.
var capM = fn < 0 ? null : capSrc.slice(fn, fn + 400).match(/\bs\.slice\(0,\s*(\d+)\)/);
if (!capM) fail("api/capture.js: could not read the cleanStack cap. Contract 3 is unverifiable.");
var CAP = capM ? Number(capM[1]) : 0;

/* ---- frozen contract 2: the answer space, in all four places it lives ---- */
function shape(o) {
  return JSON.stringify(Object.keys(o).sort().map(function (k) {
    return [k, o[k].slice().sort()];
  }));
}
function readObject(src, decl) {
  var i = src.indexOf(decl);
  if (i < 0) return null;
  i = src.indexOf("{", i);                 // start at the brace, not past it
  var j = src.indexOf("\n};", i);
  if (i < 0 || j < 0) return null;
  try {
    return JSON.parse(src.slice(i, j + 2)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "")
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
      .replace(/'/g, '"')
      .replace(/,(\s*[}\]])/g, "$1"));
  } catch (e) { return null; }
}
// the two server whitelists
["share.js", "capture.js"].forEach(function (f) {
  var v = readObject(fs.readFileSync(path.join(ROOT, "api", f), "utf8"), "const VALID = {");
  if (!v) return fail("api/" + f + ": could not read the VALID whitelist. Contract 2 is unverifiable.");
  if (shape(v) !== shape(QV)) fail("VALID drift: api/" + f + " does not match Q_VALUES in index.html. Shared links and capture will 400 on valid answers.");
});
// the share-link CODE map. It lives OUTSIDE the marked engine region, so it
// is read from the file text rather than through engine.load(). Locate it with
// `grep -n "var CODE=" index.html` - no line number is recorded here on purpose.
var htmlSrc = fs.readFileSync(engine.SRC, "utf8");
var CODE = readObject(htmlSrc, "var CODE={");
if (!CODE) fail("index.html: could not read the CODE map. Contract 2 is unverifiable.");
else {
  var codeSpace = {};
  Object.keys(CODE).forEach(function (k) { codeSpace[k] = Object.keys(CODE[k]); });
  if (shape(codeSpace) !== shape(QV)) fail("VALID drift: the CODE map in index.html does not match Q_VALUES. Share links will drop or mis-encode an answer.");
  var letters = {};
  Object.keys(CODE).forEach(function (k) {
    var seen = {};
    Object.keys(CODE[k]).forEach(function (v) {
      if (seen[CODE[k][v]]) letters[k] = 1;
      seen[CODE[k][v]] = 1;
    });
  });
  var dup = Object.keys(letters);
  if (dup.length) fail("CODE map has duplicate letters within: " + dup.join(", ") + ". Two answers would decode to the same value.");
}

/* ---- the sweep --------------------------------------------------------- */
var n = all.length, total = 0, max = 0, nowTotal = 0, nowMax = 0;
var noAlt = 0, noLayer = 0, empty = 0, badRole = {}, threw = 0, firstErr = "";
all.forEach(function (a) {
  var r;
  try { r = E.recommend(a, ""); }
  catch (e) { threw++; if (!firstErr) firstErr = JSON.stringify(a) + " -> " + e.message; return; }
  var mods = (r && r.mods) || [];
  if (!mods.length) empty++;
  total += mods.length;
  if (mods.length > max) max = mods.length;
  var now = r.coherence ? r.coherence.now : 0;   // the product's own now/later split
  nowTotal += now;
  if (now > nowMax) nowMax = now;
  mods.forEach(function (m) {
    if (!m.alts || !m.alts.length) noAlt++;
    if (!m.layer) noLayer++;
    if (!Object.prototype.hasOwnProperty.call(E.ROLE2STAGE, m.role)) badRole[m.role] = 1;
  });
});
var meanCards = total / n, meanNow = nowTotal / n;

if (threw) fail(threw + " of " + n + " combinations threw. First: " + firstErr);
if (empty) fail(empty + " of " + n + " combinations produced no recommendation cards.");
if (noAlt) fail(noAlt + " cards carry no alternatives. Every pick must show the options it beat.");
if (noLayer) fail(noLayer + " cards carry no layer.");
var missing = Object.keys(badRole);
if (missing.length) fail("roles missing from ROLE2STAGE (they fall into 'build' and lose their counterfactual): " + missing.join(", "));
if (CAP && max > CAP) fail("max result is " + max + " cards but api/capture.js caps at " + CAP + ". Raise the cap in the same commit.");
if (CAP && max === CAP) notes.push("max result (" + max + ") exactly equals the capture cap - zero headroom, as documented.");

/* ---- the upsell guard -------------------------------------------------- */
var NOW_CEILING = 12.5;
if (meanNow > NOW_CEILING) fail('mean "Start here" cards is ' + meanNow.toFixed(1) + ", above " + NOW_CEILING + ". Demote something - a wall of Start here cards is the upsell this product refuses.");

/* ---- freshness of the honest cost -------------------------------------- */
var p = String(E.CHECKED).split("-");
var now = new Date();
var ageM = (now.getFullYear() - Number(p[0])) * 12 + (now.getMonth() + 1 - Number(p[1]));
if (ageM > 6) fail("TOOLS CHECKED is " + E.CHECKED + ", " + ageM + " months old. Re-check the prices; a stale honest cost is a broken promise.");

/* ---- report ------------------------------------------------------------ */
console.log("combinations      " + n);
console.log("cards             mean " + meanCards.toFixed(1) + "   max " + max + "   cap " + CAP);
console.log('"Start here"      mean ' + meanNow.toFixed(1) + "   max " + nowMax);
console.log("missing alts      " + noAlt);
console.log("missing layer     " + noLayer);
console.log("STAGES " + E.STAGES.length + "   COMPETES " + Object.keys(E.COMPETES).length +
            "   TOOLS " + Object.keys(E.TOOLS).length + "   CHECKED " + E.CHECKED);
notes.forEach(function (m) { console.log("note: " + m); });
if (fails.length) {
  console.error("\nSWEEP FAILED");
  fails.forEach(function (m) { console.error("  - " + m); });
  process.exit(1);
}
console.log("\nsweep ok");
