/**
 * Parity worker shim — prepended to the worker entry by parity/vite.config.ts.
 *
 * Inert unless the parity env vars are set (parity/lib/server.mjs writes them
 * into dist/server/.dev.vars before starting `vite preview`):
 *
 *   PARITY_UPSTREAM  base URL of the record/replay proxy (parity/lib/upstream.mjs).
 *                    Every server-side fetch() to a non-local http(s) URL is
 *                    rewritten to `${PARITY_UPSTREAM}/__upstream?u=<original url>`
 *                    so upstream APIs (Shopify Storefront GraphQL, image hosts,
 *                    ...) are recorded once and replayed byte-for-byte.
 *   PARITY_NOW       ISO timestamp. Freezes `Date` / `Date.now()` server-side so
 *                    SSR output that depends on the clock (countdowns, date
 *                    matchers, cache TTLs) is identical between runs.
 *   PARITY_SEED      integer. Replaces Math.random with a seeded PRNG.
 *
 * The migrated (v8) site must load the same shim so both sides of a
 * comparison see identical upstream data.
 */
import { env } from "cloudflare:workers";

const UPSTREAM = env.PARITY_UPSTREAM || "";
const NOW = env.PARITY_NOW ? Date.parse(env.PARITY_NOW) : NaN;
const SEED = env.PARITY_SEED ? Number(env.PARITY_SEED) : NaN;

if (!Number.isNaN(NOW)) {
  const RealDate = Date;
  class ParityDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(NOW);
      else super(...args);
    }
    static now() {
      return NOW;
    }
  }
  globalThis.Date = ParityDate;
}

if (!Number.isNaN(SEED)) {
  // mulberry32
  let a = SEED >>> 0;
  Math.random = function parityRandom() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

if (UPSTREAM) {
  const realFetch = globalThis.fetch.bind(globalThis);
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/;
  globalThis.fetch = function parityFetch(input, init) {
    const req = new Request(input, init);
    const url = new URL(req.url);
    if (!/^https?:$/.test(url.protocol) || LOCAL.test(url.hostname) || req.url.startsWith(UPSTREAM)) {
      return realFetch(req);
    }
    const target = `${UPSTREAM}/__upstream?u=${encodeURIComponent(req.url)}`;
    return realFetch(new Request(target, req));
  };
}
