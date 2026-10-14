/**
 * Starts the site the way its README says (production build served by
 * `vite preview`, i.e. workerd via @cloudflare/vite-plugin) with the parity
 * env vars injected through dist/server/.dev.vars.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

export function build({ log }) {
  log("[server] building (npm run parity:build) ...");
  const r = spawnSync("npm", ["run", "parity:build"], { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) throw new Error("parity:build failed");
}

export function ensureBuilt({ log }) {
  const marker = path.join(ROOT, "dist/server/.parity-build");
  if (!fs.existsSync(marker)) build({ log });
}

function writeDevVars(vars) {
  const file = path.join(ROOT, "dist/server/.dev.vars");
  const keep = fs.existsSync(file)
    ? fs.readFileSync(file, "utf8").split("\n").filter((l) => l.trim() && !Object.keys(vars).some((k) => l.startsWith(`${k}=`) || l.startsWith(`${k} =`)))
    : [];
  const lines = [...keep, ...Object.entries(vars).map(([k, v]) => `${k}=${JSON.stringify(String(v))}`)];
  fs.writeFileSync(file, lines.join("\n") + "\n");
}

const children = new Set();
export function killChildren() {
  for (const pid of children) {
    try { process.kill(-pid, "SIGKILL"); } catch {}
  }
}

export async function startSite({ port, env, log }) {
  writeDevVars(env);
  // Fresh Cache API / KV state every start so edge-cache HIT/MISS never
  // depends on a previous run.
  fs.rmSync(path.join(ROOT, ".wrangler/state"), { recursive: true, force: true });
  // Pin request.cf to the location the baseline was recorded with (regionCode SP feeds the
  // X-Cache-Segment `r=` part). Left alone, the local Workers runtime uses node_modules/.mf/cf.json,
  // fetched for whatever network the machine is on and refetched once it is 30 days old. Miniflare
  // also refetches a pinned file older than 30 days, so copy it fresh on every start.
  const cfPath = path.join(ROOT, ".wrangler/parity-cf.json");
  fs.mkdirSync(path.dirname(cfPath), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "parity/runtime/cf.json"), cfPath);
  const child = spawn("npx", ["vite", "preview", "--config", "parity/vite.config.ts", "--port", String(port), "--strictPort"], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production", CLOUDFLARE_CF_FETCH_PATH: cfPath },
  });
  children.add(child.pid);
  const logFile = fs.createWriteStream(path.join(ROOT, "parity/.server.log"), { flags: "a" });
  child.stdout.pipe(logFile);
  child.stderr.pipe(logFile);
  const url = `http://localhost:${port}`;
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`vite preview exited (${child.exitCode}); see parity/.server.log`);
    try {
      const r = await fetch(`${url}/favicon.ico`);
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  log(`[server] up at ${url}`);
  return {
    url,
    async stop() {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {}
      await new Promise((r) => setTimeout(r, 1000));
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {}
      children.delete(child.pid);
    },
  };
}
