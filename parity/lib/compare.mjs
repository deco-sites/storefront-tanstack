/** Pixel (pixelmatch, threshold 0) + snapshot (exact JSON) comparison of one case. */
import fs from "node:fs";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

function listShots(dir, fileId) {
  const d = path.join(dir, "screens");
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter((f) => f.startsWith(`${fileId}--`) && f.endsWith(".png")).sort();
}

function lineDiff(a, b) {
  const A = a.split("\n");
  const B = b.split("\n");
  const out = [];
  const max = Math.max(A.length, B.length);
  for (let i = 0; i < max; i++) {
    if (A[i] !== B[i]) {
      if (A[i] !== undefined) out.push(`${i + 1}- ${A[i]}`);
      if (B[i] !== undefined) out.push(`${i + 1}+ ${B[i]}`);
    }
  }
  return out.join("\n");
}

/** Drops the headers `ignoreHeaders` lists from a parsed snapshot (and its flow steps). */
function dropIgnoredHeaders(snap, ignoreHeaders) {
  if (!ignoreHeaders?.length) return;
  for (const s of [snap, ...(Array.isArray(snap.steps) ? snap.steps : [])]) {
    if (s && s.headers && typeof s.headers === "object") for (const h of ignoreHeaders) delete s.headers[h.toLowerCase()];
  }
}

const ABSENT = "$absent";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Resolves a dotted path (`ssr.jsonLd`, `headers.cache-control`, `analytics.events[*].props.items`) on
 * the baseline and the actual snapshot side by side. `[*]` pairs up the elements of two equally long
 * arrays. Yields `{ base, act, set }` per matched leaf, where `set(v)` writes (or, for ABSENT,
 * deletes) the leaf on the actual side.
 */
function* pairs(base, act, segs) {
  const [head, ...rest] = segs;
  const star = head.endsWith("[*]");
  const key = star ? head.slice(0, -3) : head;
  if (!base || typeof base !== "object" || !act || typeof act !== "object") return;
  const b = key in base ? base[key] : ABSENT;
  const a = key in act ? act[key] : ABSENT;
  if (star) {
    if (!Array.isArray(b) || !Array.isArray(a) || a.length !== b.length) return;
    for (let i = 0; i < a.length; i++) {
      if (rest.length) yield* pairs(b[i], a[i], rest);
      else yield { base: b[i], act: a[i], set: (v) => { a[i] = v; } };
    }
  } else if (rest.length) yield* pairs(b, a, rest);
  else yield { base: b, act: a, set: (v) => { if (v === ABSENT) delete act[key]; else act[key] = v; } };
}

/** Whether `actual` on a leaf is exactly what the rule approved, given the baseline value. */
function ruleMatches(rule, baseVal, actVal, actSnap) {
  if ("baseline" in rule && !same(baseVal, rule.baseline)) return false;
  if ("actual" in rule) return same(actVal, rule.actual);
  if ("actualSameAs" in rule) {
    const [ref] = [...pairs(actSnap, actSnap, rule.actualSameAs.split("."))];
    return !!ref && actVal !== ABSENT && same(actVal, ref.act);
  }
  if ("addsOnly" in rule) {
    // An array that equals the baseline plus exactly the listed entries (snapshot arrays are sorted).
    if (!Array.isArray(baseVal) || !Array.isArray(actVal)) return false;
    const expected = [...new Set([...baseVal, ...rule.addsOnly])].sort();
    return rule.addsOnly.every((x) => !baseVal.includes(x)) && same(actVal, expected);
  }
  if ("mask" in rule) {
    // Strings equal once every `mask` match is blanked. The recorder truncates long values at a fixed
    // length, so a masked value may be cut at a different point: one must be a prefix of the other.
    if (typeof baseVal !== "string" || typeof actVal !== "string" || baseVal === actVal) return false;
    const re = new RegExp(rule.mask, "g");
    const mb = baseVal.replace(re, "\u0000");
    const ma = actVal.replace(re, "\u0000");
    return baseVal.length === actVal.length && (mb.startsWith(ma) || ma.startsWith(mb));
  }
  return false;
}

/**
 * Applies pages.json `approvedDifferences` to one case. Each rule names the cases and the one snapshot
 * field it covers, and says exactly what the new value must be (`actual`, `actualSameAs`, `addsOnly`
 * or `mask`; `baseline` pins the old value too). Where the capture matches, the field is reset to the
 * baseline value so the text comparison sees no difference; anything else on that field still fails.
 * Returns the ids of the rules that applied, for the report.
 */
function applyApprovals(id, base, act, rules) {
  const applied = new Set();
  for (const rule of rules ?? []) {
    if (!rule.cases.includes(id)) continue;
    for (const leaf of pairs(base, act, rule.path.split("."))) {
      if (same(leaf.base, leaf.act)) continue;
      if (ruleMatches(rule, leaf.base, leaf.act, act)) {
        leaf.set(leaf.base === ABSENT ? ABSENT : structuredClone(leaf.base));
        applied.add(rule.id);
      }
    }
  }
  return [...applied];
}

const toText = (snap, raw) => JSON.stringify(snap, null, 2) + (raw.endsWith("\n") ? "\n" : "");

export function compareCase({ id, fileId, error, baseDir, actualDir, outRoot, ignoreHeaders, approvedDifferences }) {
  const problems = [];
  let approved = [];
  const diffDir = path.join(outRoot, "diff");
  if (error) problems.push(`capture error: ${error}`);

  const baseShots = listShots(baseDir, fileId);
  const actShots = listShots(actualDir, fileId);
  for (const f of new Set([...baseShots, ...actShots])) {
    const bp = path.join(baseDir, "screens", f);
    const ap = path.join(actualDir, "screens", f);
    if (!fs.existsSync(bp)) { problems.push(`${f}: not in baseline`); continue; }
    if (!fs.existsSync(ap)) { problems.push(`${f}: missing in actual`); continue; }
    const b = PNG.sync.read(fs.readFileSync(bp));
    const a = PNG.sync.read(fs.readFileSync(ap));
    if (b.width !== a.width || b.height !== a.height) {
      problems.push(`${f}: size ${b.width}x${b.height} -> ${a.width}x${a.height}`);
      continue;
    }
    const diff = new PNG({ width: b.width, height: b.height });
    const n = pixelmatch(b.data, a.data, diff.data, b.width, b.height, { threshold: 0, includeAA: true });
    if (n > 0) {
      fs.mkdirSync(diffDir, { recursive: true });
      fs.writeFileSync(path.join(diffDir, f), PNG.sync.write(diff));
      problems.push(`${f}: ${n} px differ (${((100 * n) / (b.width * b.height)).toFixed(3)}%)`);
    }
  }

  const sb = path.join(baseDir, "snapshots", `${fileId}.json`);
  const sa = path.join(actualDir, "snapshots", `${fileId}.json`);
  if (!fs.existsSync(sb)) problems.push("snapshot: not in baseline");
  else if (!fs.existsSync(sa)) { if (!error) problems.push("snapshot: missing in actual"); }
  else {
    // The baseline was recorded before these were approved, so they are applied to both sides here
    // rather than re-recorded.
    const rawB = fs.readFileSync(sb, "utf8");
    const rawA = fs.readFileSync(sa, "utf8");
    const base = JSON.parse(rawB);
    const act = JSON.parse(rawA);
    dropIgnoredHeaders(base, ignoreHeaders);
    dropIgnoredHeaders(act, ignoreHeaders);
    approved = applyApprovals(id, base, act, approvedDifferences);
    const tb = toText(base, rawB);
    const ta = toText(act, rawA);
    if (tb !== ta) {
      fs.mkdirSync(diffDir, { recursive: true });
      fs.writeFileSync(path.join(diffDir, `${fileId}.snapshot.diff`), lineDiff(tb, ta) + "\n");
      problems.push(`snapshot differs (diff/${fileId}.snapshot.diff)`);
    }
  }
  return { id, ok: problems.length === 0, problems, approved };
}
