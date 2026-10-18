#!/usr/bin/env node
/** Serve the parity build with the upstream proxy (replay by default, `--record` for live) until Ctrl-C. Authoring/debug aid. */
import path from "node:path";
import fs from "node:fs";
import { startUpstream } from "./lib/upstream.mjs";
import { ROOT, ensureBuilt, startSite } from "./lib/server.mjs";
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "parity/pages.json"), "utf8"));
const record = process.argv.includes("--record");
const scratch = path.join(ROOT, "parity/runs/serve");
fs.mkdirSync(scratch, { recursive: true });
ensureBuilt({ log: console.log });
const upstream = await startUpstream({ port: manifest.ports.upstream, mode: record ? "record" : "replay", storePath: record ? path.join(scratch, "upstream.json") : path.join(ROOT, "parity/baseline/upstream.json"), passthroughOnMiss: true, log: console.log });
const site = await startSite({ port: manifest.ports.site, env: { PARITY_UPSTREAM: upstream.url, PARITY_NOW: manifest.fixedTime, PARITY_SEED: manifest.randomSeed, ...manifest.siteEnv }, log: console.log });
console.log(`serving ${site.url} (upstream ${record ? "record" : "replay"} at ${upstream.url})`);
const stop = async () => { await site.stop(); await upstream.close(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
