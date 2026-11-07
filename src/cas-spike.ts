/**
 * cas-spike-worker.ts: the Workers counterpart of cas-preload.mjs.
 *
 * Copy into the site (e.g. src/cas-spike.ts) and import it FIRST in the worker
 * entry (`import "./cas-spike";`). It reads two vars from the Worker env:
 *   CAS_DELIVERY_ORIGIN  e.g. https://delivery.decocms.com/spikes/cas-sites/<dir>/<run>
 *                        (publish-r2.ts prints it as `origin`)
 *   CAS_TRACE            "1" logs every outbound fetch as a `[cas-fetch] {...}` line
 * measure.sh passes both as `--var` flags in $CAS_WRANGLER_VARS (and as env).
 * With neither set it does nothing, so production behaviour is unchanged.
 *
 * Why: @decocms/blocks 8.10.0 fetches `${origin}/sites/<site>/...` with origin
 * fixed to https://delivery.decocms.com (remoteLoader.ts:59); the only way to
 * read a release under the spikes/ prefix is the test-only global
 * Symbol.for("decocms.blocks.test.deliveryOrigin") (remoteLoader.ts:64,480).
 * deliveryOrigin() reads it on every fetch, so setting it at module scope works.
 */
import { env } from "cloudflare:workers";

const vars = env as unknown as Record<string, string | undefined>;
const ORIGIN = vars.CAS_DELIVERY_ORIGIN;
if (ORIGIN) (globalThis as Record<symbol, unknown>)[Symbol.for("decocms.blocks.test.deliveryOrigin")] = ORIGIN;

if (vars.CAS_TRACE === "1") {
  const real = globalThis.fetch;
  globalThis.fetch = async function casTracedFetch(input: RequestInfo | URL, init?: RequestInit) {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const t0 = performance.now();
    const res = await real(input, init);
    // Workers' performance.now()/Date.now() advance across I/O, so this is the fetch's own time.
    const ms = performance.now() - t0;
    const line: Record<string, unknown> = {
      kind: url.hostname === "delivery.decocms.com" ? "delivery" : "upstream",
      host: url.hostname,
      path: url.pathname.slice(0, 160),
      status: res.status,
      cache: res.headers.get("cf-cache-status"),
      ms: Math.round(ms * 10) / 10,
      bytes: null,
    };
    res
      .clone()
      .arrayBuffer()
      .then(
        (b) => {
          line.bytes = b.byteLength;
          line.body_ms = Math.round((performance.now() - t0) * 10) / 10;
          console.log(`[cas-fetch] ${JSON.stringify(line)}`);
        },
        () => console.log(`[cas-fetch] ${JSON.stringify(line)}`),
      );
    return res;
  } as typeof fetch;
}

export {};
