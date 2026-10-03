#!/usr/bin/env node
/**
 * Parity harness CLI.
 *
 *   node parity/run.mjs record   [--only <substr>] [--rebuild]
 *   node parity/run.mjs compare  [--target <url>] [--only <substr>] [--label <name>] [--rebuild]
 *
 * record:  1) live pass — serves the parity build with the upstream proxy in
 *             record mode and every third-party browser request recorded into
 *             per-case HAR files;
 *          2) capture pass — restarts everything in replay mode and writes the
 *             baseline screenshots + snapshots (exactly the conditions compare
 *             uses), so the baseline is itself a replayed run.
 * compare: replay mode against --target (default: starts the local parity
 *          build). Writes parity/runs/<label>/{actual,diff,summary.*} and exits
 *          non-zero on any pixel, snapshot or missing-capture difference.
 *          A --target served elsewhere must load parity/runtime/worker-shim.js
 *          with PARITY_UPSTREAM=http://127.0.0.1:<upstreamPort> (printed at
 *          start) to get the replayed upstream data.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { runCase } from "./lib/capture.mjs";
import { compareCase } from "./lib/compare.mjs";
import { startUpstream } from "./lib/upstream.mjs";
import { ROOT, build, ensureBuilt, killChildren, startSite } from "./lib/server.mjs";

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (name) => args.includes(`--${name}`);
const log = (...m) => console.log(...m);

// Make sure Ctrl-C / kill never leaves the preview server or proxy holding the ports.
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    killChildren();
    process.exit(130);
  });
}

const PARITY = path.join(ROOT, "parity");
const BASE = path.join(PARITY, "baseline");
const manifest = JSON.parse(fs.readFileSync(path.join(PARITY, "pages.json"), "utf8"));
const SITE_PORT = manifest.ports?.site ?? 4173;
const UP_PORT = manifest.ports?.upstream ?? 4180;

function expandCases() {
  const cases = [];
  for (const p of manifest.pages) for (const vp of p.viewports ?? Object.keys(manifest.viewports)) cases.push({ ...p, kind: "page", viewport: vp, id: `${p.id}@${vp}` });
  for (const f of manifest.flows ?? []) for (const vp of f.viewports ?? Object.keys(manifest.viewports)) cases.push({ ...f, kind: "flow", viewport: vp, id: `${f.id}@${vp}` });
  for (const t of manifest.texts ?? []) cases.push({ ...t, kind: "text", id: t.id });
  const only = flag("only");
  return only ? cases.filter((c) => only.split(",").some((o) => c.id.includes(o))) : cases;
}

const siteEnv = (upstreamUrl) => ({
  PARITY_UPSTREAM: upstreamUrl,
  PARITY_NOW: manifest.fixedTime,
  PARITY_SEED: manifest.randomSeed,
  ...(manifest.siteEnv ?? {}),
});

const fileId = (id) => id.replace(/[^a-zA-Z0-9@._-]+/g, "_");

async function capturePass({ cases, baseURL, mode, upstream, outDir, harDir }) {
  const browser = await chromium.launch({ args: manifest.chromiumArgs ?? [] });
  const results = [];
  try {
    for (const kase of cases) {
      upstream.setCase(kase.id);
      const harPath = path.join(harDir, `${fileId(kase.id)}.har`);
      if (mode === "replay" && kase.kind !== "text" && !fs.existsSync(harPath)) {
        results.push({ id: kase.id, error: `no HAR fixture ${path.relative(ROOT, harPath)} (run parity:record)` });
        continue;
      }
      const t0 = Date.now();
      try {
        const { screenshots, snapshot } = await runCase({ browser, manifest, kase, baseURL, mode, harPath, log });
        if (outDir) {
          fs.mkdirSync(path.join(outDir, "screens"), { recursive: true });
          fs.mkdirSync(path.join(outDir, "snapshots"), { recursive: true });
          for (const s of screenshots) fs.writeFileSync(path.join(outDir, "screens", `${fileId(kase.id)}--${fileId(s.name)}.png`), s.buf);
          fs.writeFileSync(path.join(outDir, "snapshots", `${fileId(kase.id)}.json`), JSON.stringify(snapshot, null, 2) + "\n");
        }
        results.push({ id: kase.id, screenshots: screenshots.map((s) => s.name) });
        log(`  ok   ${kase.id} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
      } catch (err) {
        results.push({ id: kase.id, error: err.message });
        log(`  FAIL ${kase.id}: ${err.message}`);
      }
    }
  } finally {
    await browser.close();
  }
  return results;
}

/** Strip cookies from recorded HARs: they are never needed for replay and must not be committed. */
function sanitizeHars(harDir) {
  const DROP = new Set(["cookie", "set-cookie", "authorization"]);
  for (const f of fs.readdirSync(harDir).filter((x) => x.endsWith(".har"))) {
    const file = path.join(harDir, f);
    const har = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const e of har.log.entries) {
      for (const side of [e.request, e.response]) {
        side.headers = side.headers.filter((h) => !DROP.has(h.name.toLowerCase()));
        side.cookies = [];
      }
    }
    fs.writeFileSync(file, JSON.stringify(har));
  }
}

async function record() {
  const cases = expandCases();
  if (has("rebuild")) build({ log });
  else ensureBuilt({ log });
  const harDir = path.join(BASE, "har");
  const storePath = path.join(BASE, "upstream.json");
  const partial = !!flag("only");
  if (partial) throw new Error("record --only is not supported: the upstream store is rewritten as a whole");
  fs.rmSync(BASE, { recursive: true, force: true });
  fs.mkdirSync(harDir, { recursive: true });

  log("[record] pass 1/2: live recording (upstream + HAR)");
  let upstream = await startUpstream({ port: UP_PORT, mode: "record", storePath, log });
  let site = await startSite({ port: SITE_PORT, env: siteEnv(upstream.url), log });
  let r1;
  try {
    r1 = await capturePass({ cases, baseURL: site.url, mode: "record", upstream, outDir: null, harDir });
  } finally {
    await site.stop();
    upstream.save();
    await upstream.close();
  }
  sanitizeHars(harDir);
  const failed1 = r1.filter((r) => r.error);
  if (failed1.length) log(`[record] ${failed1.length} case(s) failed during recording`);

  log("[record] pass 2/2: baseline capture in replay mode");
  upstream = await startUpstream({ port: UP_PORT, mode: "replay", storePath, log });
  site = await startSite({ port: SITE_PORT, env: siteEnv(upstream.url), log });
  let r2;
  try {
    r2 = await capturePass({ cases, baseURL: site.url, mode: "replay", upstream, outDir: BASE, harDir });
  } finally {
    await site.stop();
    await upstream.close();
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const { execSync } = await import("node:child_process");
  const sha = execSync("git rev-parse HEAD", { cwd: ROOT }).toString().trim();
  const meta = {
    recordedAt: new Date().toISOString(),
    gitSha: sha,
    contentRevision: "bundled .deco/blocks at gitSha (DECO_FAST_DEPLOY=0)",
    playwright: JSON.parse(fs.readFileSync(path.join(ROOT, "node_modules/playwright/package.json"), "utf8")).version,
    chromium: (await chromium.launch().then(async (b) => { const v = b.version(); await b.close(); return v; })),
    platform: `${process.platform}-${process.arch}`,
    decocms: Object.fromEntries(Object.entries(pkg.dependencies).filter(([k]) => k.startsWith("@decocms/"))),
    upstreamMisses: upstream.misses,
    cases: r2,
  };
  fs.writeFileSync(path.join(BASE, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  const failed = r2.filter((r) => r.error);
  log(`[record] done: ${r2.length - failed.length}/${r2.length} cases captured, ${upstream.misses.length} upstream misses`);
  for (const f of failed) log(`  - ${f.id}: ${f.error}`);
  process.exitCode = failed.length ? 1 : 0;
}

async function compare() {
  const cases = expandCases();
  const label = flag("label") ?? new Date().toISOString().replace(/[:.]/g, "-");
  const outRoot = path.join(PARITY, "runs", label);
  const actualDir = path.join(outRoot, "actual");
  fs.rmSync(outRoot, { recursive: true, force: true });
  fs.mkdirSync(actualDir, { recursive: true });
  const storePath = path.join(BASE, "upstream.json");
  const upstream = await startUpstream({ port: UP_PORT, mode: "replay", storePath, passthroughOnMiss: has("upstream-passthrough"), log });
  log(`[compare] upstream replay proxy at ${upstream.url}`);
  let site = null;
  let baseURL = flag("target");
  try {
    if (!baseURL) {
      if (has("rebuild")) build({ log });
      else ensureBuilt({ log });
      site = await startSite({ port: SITE_PORT, env: siteEnv(upstream.url), log });
      baseURL = site.url;
    }
    baseURL = baseURL.replace(/\/$/, "");
    log(`[compare] target ${baseURL}, ${cases.length} cases -> ${path.relative(ROOT, outRoot)}`);
    const results = await capturePass({ cases, baseURL, mode: "replay", upstream, outDir: actualDir, harDir: path.join(BASE, "har") });
    const report = [];
    for (const r of results) report.push(compareCase({ id: r.id, fileId: fileId(r.id), error: r.error, baseDir: BASE, actualDir, outRoot }));
    const summary = {
      label,
      target: baseURL,
      at: new Date().toISOString(),
      total: report.length,
      passed: report.filter((r) => r.ok).length,
      failed: report.filter((r) => !r.ok).length,
      upstreamMisses: upstream.misses,
      cases: report,
    };
    fs.writeFileSync(path.join(outRoot, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
    const md = [
      `# Parity compare ${label}`,
      ``,
      `target: ${baseURL}  `,
      `result: **${summary.failed === 0 ? "PASS" : "FAIL"}** — ${summary.passed}/${summary.total} cases identical, upstream misses: ${upstream.misses.length}`,
      ``,
      `| case | result | details |`,
      `|---|---|---|`,
      ...report.map((r) => `| ${r.id} | ${r.ok ? "ok" : "**DIFF**"} | ${r.problems.join("; ").replace(/\|/g, "\\|")} |`),
      ``,
    ].join("\n");
    fs.writeFileSync(path.join(outRoot, "summary.md"), md);
    log(md);
    process.exitCode = summary.failed === 0 && (!has("strict-upstream") || upstream.misses.length === 0) ? 0 : 1;
  } finally {
    if (site) await site.stop();
    await upstream.close();
  }
}

async function probe() {
  // Authoring aid: run selected cases live (no fixtures written to baseline).
  const cases = expandCases();
  const outRoot = path.join(PARITY, "runs", "probe");
  fs.rmSync(outRoot, { recursive: true, force: true });
  fs.mkdirSync(path.join(outRoot, "har"), { recursive: true });
  ensureBuilt({ log });
  const upstream = await startUpstream({ port: UP_PORT, mode: "record", storePath: path.join(outRoot, "upstream.json"), log });
  const site = flag("target") ? null : await startSite({ port: SITE_PORT, env: siteEnv(upstream.url), log });
  try {
    await capturePass({ cases, baseURL: (flag("target") ?? site.url).replace(/\/$/, ""), mode: "record", upstream, outDir: outRoot, harDir: path.join(outRoot, "har") });
  } finally {
    if (site) await site.stop();
    await upstream.close();
  }
}

if (cmd === "record") await record();
else if (cmd === "probe") await probe();
else if (cmd === "compare") await compare();
else {
  console.error("usage: node parity/run.mjs <record|compare> [--target url] [--only ids] [--label name] [--rebuild] [--upstream-passthrough] [--strict-upstream]");
  process.exit(2);
}
