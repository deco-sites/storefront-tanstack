#!/usr/bin/env node
/**
 * Live back-to-back comparison of two builds of this site: "prod" (main, built
 * in another worktree) and "PR" (this worktree). No baseline, no recordings:
 * every case is captured on prod and then immediately on the PR, both against
 * the live upstream (server-side fetches go through a forwarding proxy so the
 * parity shim still freezes the clock and seeds Math.random), so live data has
 * no time to drift between the two captures.
 *
 *   node parity/dual.mjs --prod-root ../main-worktree [--out dir] [--only ids] [--control]
 *
 * --control captures prod twice (prod vs prod): any region that differs there
 * is live-data noise, and is the only thing a mask may ever cover.
 *
 * Both worktrees need a parity build (`npm run parity:build`). Screenshots,
 * diff images (red = differing pixel) and summary.{json,md} go to --out.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { runCase } from "./lib/capture.mjs";
import { startUpstream } from "./lib/upstream.mjs";

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const has = (n) => args.includes(`--${n}`);
const log = (...m) => console.log(...m);

const PR_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PROD_ROOT = path.resolve(flag("prod-root") ?? "");
if (!flag("prod-root")) throw new Error("--prod-root <main worktree> is required");
const control = has("control");
const OUT = path.resolve(flag("out") ?? path.join(PR_ROOT, "parity/runs", control ? "dual-control" : "dual"));
const manifest = JSON.parse(fs.readFileSync(path.join(PR_ROOT, "parity/pages.json"), "utf8"));
const PORT_BASE = Number(flag("port") ?? 4373);

const fileId = (id) => id.replace(/[^a-zA-Z0-9@._-]+/g, "_");

const extra = JSON.parse(fs.readFileSync(path.join(PR_ROOT, "parity/dual-cases.json"), "utf8"));

function expandCases() {
  const cases = [];
  // A flow step that can't run (nothing to click) is skipped instead of failing the case, so both
  // sides still capture; which steps were skipped is part of the compared snapshot values.
  const lenient = (f) => ({ ...f, steps: f.steps.map((s) => ({ ...s, optional: true, timeout: s.timeout ?? 10_000 })) });
  manifest.pages = [...manifest.pages, ...(extra.pages ?? [])];
  manifest.flows = [...(manifest.flows ?? []), ...(extra.flows ?? [])].map(lenient);
  for (const p of manifest.pages) for (const vp of p.viewports ?? Object.keys(manifest.viewports)) cases.push({ ...p, kind: "page", viewport: vp, id: `${p.id}@${vp}` });
  for (const f of manifest.flows ?? []) for (const vp of f.viewports ?? Object.keys(manifest.viewports)) cases.push({ ...f, kind: "flow", viewport: vp, id: `${f.id}@${vp}` });
  const only = flag("only");
  return only ? cases.filter((c) => only.split(",").some((o) => c.id.includes(o))) : cases;
}

const killers = [];
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, async () => { for (const k of killers) await k(); process.exit(130); });

async function start(root, port, upstreamUrl) {
  const { startSite, ensureBuilt } = await import(path.join(root, "parity/lib/server.mjs"));
  ensureBuilt({ log });
  const site = await startSite({ port, env: { PARITY_UPSTREAM: upstreamUrl, PARITY_NOW: manifest.fixedTime, PARITY_SEED: manifest.randomSeed, ...(manifest.siteEnv ?? {}) }, log });
  killers.push(() => site.stop());
  return site;
}

function diffPng(a, b, outPath) {
  const A = PNG.sync.read(a);
  const B = PNG.sync.read(b);
  const w = Math.max(A.width, B.width);
  const h = Math.max(A.height, B.height);
  const pad = (img) => {
    if (img.width === w && img.height === h) return img;
    const p = new PNG({ width: w, height: h });
    p.data.fill(255);
    PNG.bitblt(img, p, 0, 0, img.width, img.height, 0, 0);
    return p;
  };
  const pa = pad(A);
  const pb = pad(B);
  const d = new PNG({ width: w, height: h });
  const n = pixelmatch(pa.data, pb.data, d.data, w, h, { threshold: 0, includeAA: true });
  const sizeDiff = A.width !== B.width || A.height !== B.height;
  if (n || sizeDiff) fs.writeFileSync(outPath, PNG.sync.write(d));
  // Rows that differ, as [from, to] bands — tells which section moved.
  const bands = [];
  for (let y = 0; y < h; y++) {
    let row = false;
    for (let x = 0; x < w && !row; x++) {
      const i = (y * w + x) * 4;
      if (d.data[i] === 255 && d.data[i + 1] === 0 && d.data[i + 2] === 0) row = true;
    }
    if (row) {
      const last = bands[bands.length - 1];
      if (last && last[1] === y - 1) last[1] = y;
      else bands.push([y, y]);
    }
  }
  return { pixels: n, size: `${A.width}x${A.height} vs ${B.width}x${B.height}`, sizeDiff, bands: bands.slice(0, 12) };
}

const cases = expandCases();
fs.rmSync(OUT, { recursive: true, force: true });
for (const d of ["prod", "pr", "diff", "har"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });

const upstream = await startUpstream({ port: PORT_BASE + 7, mode: "record", storePath: path.join(OUT, "upstream.json"), log });
killers.push(() => upstream.close());
const prod = await start(PROD_ROOT, PORT_BASE, upstream.url);
const pr = control ? null : await start(PR_ROOT, PORT_BASE + 1, upstream.url);
const browser = await chromium.launch({ args: manifest.chromiumArgs ?? [] });

const report = [];
try {
  for (const kase of cases) {
    const shots = {};
    const snaps = {};
    const errors = [];
    const sides = control ? [["prod", prod.url], ["pr", prod.url]] : [["prod", prod.url], ["pr", pr.url]];
    for (const [side, url] of sides) {
      upstream.setCase(`${side}:${kase.id}`);
      try {
        const r = await runCase({ browser, manifest, kase, baseURL: url, mode: "record", harPath: path.join(OUT, "har", `${side}-${fileId(kase.id)}.har`), log });
        shots[side] = r.screenshots;
        snaps[side] = r.snapshot;
        for (const s of r.screenshots) fs.writeFileSync(path.join(OUT, side, `${fileId(kase.id)}--${s.name}.png`), s.buf);
        fs.writeFileSync(path.join(OUT, side, `${fileId(kase.id)}.json`), JSON.stringify(r.snapshot, null, 2) + "\n");
      } catch (err) {
        errors.push(`${side}: ${err.message.split("\n")[0]}`);
      }
    }
    const entry = { id: kase.id, shots: [], errors };
    if (shots.prod && shots.pr) {
      const names = new Set([...shots.prod.map((s) => s.name), ...shots.pr.map((s) => s.name)]);
      for (const name of names) {
        const a = shots.prod.find((s) => s.name === name);
        const b = shots.pr.find((s) => s.name === name);
        if (!a || !b) { entry.shots.push({ name, missing: !a ? "prod" : "pr" }); continue; }
        const r = diffPng(a.buf, b.buf, path.join(OUT, "diff", `${fileId(kase.id)}--${name}.png`));
        entry.shots.push({ name, ...r });
      }
    }
    if (snaps.prod && snaps.pr) {
      // Each live run creates its own Shopify cart, so the checkout URL's cart id, key and _s/_y session ids are per run.
      const pick = (x) => JSON.stringify({ status: x.status ?? null, finalUrl: x.finalUrl ?? null, values: x.values ?? null }).replace(/\/cart\/c\/[^"]+/g, "/cart/c/<cart>");
      if (pick(snaps.prod) !== pick(snaps.pr)) errors.push(`status/url/flow values differ: prod ${pick(snaps.prod)} pr ${pick(snaps.pr)}`);
    }
    entry.ok = !errors.length && entry.shots.every((s) => !s.missing && s.pixels === 0 && !s.sizeDiff);
    report.push(entry);
    log(`  ${entry.ok ? "ZERO" : "DIFF"} ${kase.id} ${entry.shots.map((s) => `${s.name}:${s.missing ? `missing ${s.missing}` : `${s.pixels}px ${s.size}`}`).join(" ")} ${errors.join("; ")}`);
  }
} finally {
  await browser.close();
  upstream.save();
  for (const k of killers) await k();
}

const zero = report.filter((r) => r.ok).length;
fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify({ at: new Date().toISOString(), control, total: report.length, zero, cases: report }, null, 2) + "\n");
const md = [
  `# ${control ? "prod vs prod (control)" : "prod (main) vs PR"} — live, back to back`,
  ``,
  `${zero}/${report.length} captures with zero differing pixels`,
  ``,
  `| case | result | screenshots |`,
  `|---|---|---|`,
  ...report.map((r) => `| ${r.id} | ${r.ok ? "zero" : "**DIFF**"} | ${[...r.shots.map((s) => `${s.name}: ${s.missing ? `missing on ${s.missing}` : `${s.pixels}px, ${s.size}${s.bands?.length ? `, rows ${s.bands.map((b) => b.join("-")).join(" ")}` : ""}`}`), ...r.errors].join("; ")} |`),
  ``,
].join("\n");
fs.writeFileSync(path.join(OUT, "summary.md"), md);
log(md);
process.exitCode = zero === report.length ? 0 : 1;
