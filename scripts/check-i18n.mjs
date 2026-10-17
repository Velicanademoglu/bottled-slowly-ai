import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import ts from "../frontend/node_modules/typescript/lib/typescript.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadModule(rel) {
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  const tmp = path.join(root, "scripts", "tmp-i18n-" + Math.random().toString(36).slice(2) + ".mjs");
  fs.writeFileSync(tmp, js);
  return import("file:///" + tmp.replace(/\\/g, "/")).then((m) => {
    fs.unlinkSync(tmp);
    return m.default;
  });
}

const tr = await loadModule("frontend/src/i18n/tr.ts");
const en = await loadModule("frontend/src/i18n/en.ts");

function flat(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + "." + k : k;
    if (typeof v === "object" && v !== null) Object.assign(out, flat(v, key));
    else out[key] = v;
  }
  return out;
}

const trKeys = new Set(Object.keys(flat(tr)));
const enKeys = new Set(Object.keys(flat(en)));

const missingInEn = [...trKeys].filter((k) => !enKeys.has(k));
const missingInTr = [...enKeys].filter((k) => !trKeys.has(k));

console.log("TR keys:", trKeys.size, "EN keys:", enKeys.size);
console.log("MISSING in EN:", missingInEn.length ? missingInEn : "none");
console.log("MISSING in TR:", missingInTr.length ? missingInTr : "none");

const must = [
  "premium.pageTitle", "premium.voiceTierTitle", "premium.videoTierTitle", "premium.subscribe",
  "call.connecting", "call.end", "common.month", "common.balance", "common.back",
];
const absent = must.filter((k) => !trKeys.has(k) || !enKeys.has(k));
console.log("REQUIRED MISSING:", absent.length ? absent : "none");
