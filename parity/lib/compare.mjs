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

export function compareCase({ id, fileId, error, baseDir, actualDir, outRoot }) {
  const problems = [];
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
    const tb = fs.readFileSync(sb, "utf8");
    const ta = fs.readFileSync(sa, "utf8");
    if (tb !== ta) {
      fs.mkdirSync(diffDir, { recursive: true });
      fs.writeFileSync(path.join(diffDir, `${fileId}.snapshot.diff`), lineDiff(tb, ta) + "\n");
      problems.push(`snapshot differs (diff/${fileId}.snapshot.diff)`);
    }
  }
  return { id, ok: problems.length === 0, problems };
}
