// Load index.html's engine region as a Node module.
// Anchored on markers, never line numbers - index.html drifts constantly.
//
// The region is everything that computes: STAGES, TOOLS, COMPETES, decide(),
// recommend(), and graphTargets(). Two things in it reach for the DOM - the $
// helper and the last line of graphTargets() - but only when called, and the
// sweep calls neither, so loading the region has no side effects.
//
// Both shims below are deliberate. matchMedia runs at load time and must return
// something. document is a tripwire: nothing should reach it, so touching it
// raises a named error instead of a bare ReferenceError, which is what a future
// export that pulls DOM code into the sweep would otherwise produce.
var fs = require("fs");
var path = require("path");
var os = require("os");

var ROOT = path.join(__dirname, "..");
var SRC = path.join(ROOT, "index.html");
var START = "/* ENGINE:START */";
var END = "/* ENGINE:END */";

function slice() {
  var html = fs.readFileSync(SRC, "utf8");
  var a = html.indexOf(START), b = html.indexOf(END);
  if (a < 0 || b < 0 || b < a) {
    throw new Error(
      "index.html is missing the " + START + " / " + END + " markers.\n" +
      "The engine check is anchored on them. Restore both around the engine\n" +
      "region: START right after <script>, END right before the canvas rendering\n" +
      "block. Do not replace them with line numbers - the file drifts."
    );
  }
  return html.slice(a + START.length, b);
}

var EXPORTS = ["decide", "recommend", "Q_VALUES", "STAGES", "NODES",
               "TOOLS", "COMPETES", "ROLE2STAGE", "CHECKED", "LAYER_OF"];

var SHIMS = [
  "var window={matchMedia:function(){return{matches:false};}};",
  "var document={get documentElement(){return domReached();}," +
  "querySelector:function(){return domReached();}};",
  "function domReached(){throw new Error(" +
  "'engine.js: the engine region reached for the DOM. It is loaded outside a " +
  "browser, so it must stay computation-only. Either the export list now pulls " +
  "in rendering code, or rendering code moved above the ENGINE:END marker.');}"
].join("\n");

var cached = null;

function load() {
  if (cached) return cached;              // one temp dir per process, not per call
  var body = [
    SHIMS,
    slice(),
    "module.exports={" + EXPORTS.map(function (n) { return n + ":" + n; }).join(",") + "};"
  ].join("\n");
  var tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "gw-engine-")), "engine.js");
  fs.writeFileSync(tmp, body);
  cached = require(tmp);
  return cached;
}

module.exports = { load: load, slice: slice, ROOT: ROOT, SRC: SRC };
