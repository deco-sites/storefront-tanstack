/**
 * Server-side upstream record/replay proxy.
 *
 * The parity worker shim rewrites every outbound fetch from the worker to
 *   http://127.0.0.1:<port>/__upstream?u=<original url>
 * In "record" mode the request is forwarded to the real upstream and the
 * response stored; in "replay" mode the stored response is served and the
 * real upstream is never contacted.
 *
 * Responses are keyed by `${method} ${url} ${sha1(body)}` and grouped by the
 * harness case that was running when they were recorded, in arrival order, so
 * stateful sequences (cart query -> add line -> cart query) replay correctly.
 * A key never seen for the current case falls back to the first recording of
 * that key from any case (the worker's in-memory caches can move a call to a
 * different case when only a subset of cases runs).
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import http from "node:http";

const KEEP_HEADERS = ["content-type", "location", "cache-control"];

function keyOf(method, url, body) {
  const h = createHash("sha1").update(body ?? Buffer.alloc(0)).digest("hex").slice(0, 16);
  return `${method} ${url} ${h}`;
}

export async function startUpstream({ port, mode, storePath, passthroughOnMiss = false, log = () => {} }) {
  /** @type {{version:number, entries: Record<string, Array<{case:string,status:number,headers:Record<string,string|string[]>,body:string}>>}} */
  let store = { version: 1, entries: {} };
  if (mode === "replay") {
    store = JSON.parse(fs.readFileSync(storePath, "utf8"));
  }
  let currentCase = "boot";
  const counters = new Map();
  const misses = [];
  const served = [];

  function pick(key) {
    const list = store.entries[key];
    if (!list || list.length === 0) return null;
    const mine = list.filter((e) => e.case === currentCase);
    if (mine.length === 0) return list[0];
    const ck = `${currentCase}\u0000${key}`;
    const n = counters.get(ck) ?? 0;
    counters.set(ck, n + 1);
    return mine[Math.min(n, mine.length - 1)];
  }

  async function forward(method, url, headers, body) {
    const h = {};
    for (const [k, v] of Object.entries(headers)) {
      if (["host", "connection", "content-length", "accept-encoding", "cf-connecting-ip", "x-forwarded-for"].includes(k)) continue;
      h[k] = Array.isArray(v) ? v.join(", ") : v;
    }
    const res = await fetch(url, { method, headers: h, body: ["GET", "HEAD"].includes(method) ? undefined : body, redirect: "manual" });
    const buf = Buffer.from(await res.arrayBuffer());
    const outHeaders = {};
    for (const k of KEEP_HEADERS) {
      if (k === "set-cookie") {
        const sc = res.headers.getSetCookie?.() ?? [];
        if (sc.length) outHeaders[k] = sc;
      } else {
        const v = res.headers.get(k);
        if (v != null) outHeaders[k] = v;
      }
    }
    return { status: res.status, headers: outHeaders, body: buf.toString("base64") };
  }

  const server = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, "http://x");
      if (u.pathname !== "/__upstream") {
        res.writeHead(404).end("parity upstream: unknown path");
        return;
      }
      const target = u.searchParams.get("u");
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = Buffer.concat(chunks);
      const key = keyOf(req.method, target, body);
      let entry;
      if (mode === "record") {
        entry = await forward(req.method, target, req.headers, body);
        (store.entries[key] ??= []).push({ case: currentCase, ...entry });
      } else {
        entry = pick(key);
        if (!entry) {
          misses.push({ case: currentCase, key });
          log(`[upstream] MISS ${currentCase} ${key}`);
          if (passthroughOnMiss) entry = await forward(req.method, target, req.headers, body);
          else {
            res.writeHead(599, { "content-type": "text/plain", "x-parity-miss": "1" }).end("parity upstream: no recording");
            return;
          }
        }
      }
      served.push({ case: currentCase, key, status: entry.status });
      const headers = { ...entry.headers };
      res.writeHead(entry.status, headers);
      res.end(Buffer.from(entry.body, "base64"));
    } catch (err) {
      log(`[upstream] error ${err?.stack || err}`);
      res.writeHead(502, { "content-type": "text/plain" }).end(String(err));
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });

  return {
    url: `http://127.0.0.1:${port}`,
    setCase(id) {
      currentCase = id;
    },
    misses,
    served,
    save() {
      if (mode !== "record") return;
      const sorted = {};
      for (const k of Object.keys(store.entries).sort()) sorted[k] = store.entries[k];
      fs.writeFileSync(storePath, JSON.stringify({ version: 1, entries: sorted }, null, 1) + "\n");
    },
    close: () => new Promise((r) => server.close(() => r())),
  };
}
