/**
 * Cloudflare Worker entry point — Shopify storefront.
 *
 * Handles admin protocol, CSP, device segmentation, and edge caching.
 * Shopify checkout runs on Shopify's hosted checkout (or the store's domain)
 * and does not need a reverse proxy — all commerce calls go via the
 * Storefront API (GraphQL) from the server loaders.
 *
 * MANUAL REVIEW: Add site-specific CSP domains (analytics, CDN, tag managers).
 */
import "./setup";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { createDecoWorkerEntry } from "@decocms/tanstack";
import { instrumentWorker } from "@decocms/blocks/sdk/otel";
import { detectDevice } from "@decocms/blocks/sdk/useDevice";
import {
  handleMeta,
  handleDecofileRead,
  handleDecofileReload,
  handleRender,
  corsHeaders,
} from "@decocms/blocks-admin";
import { getCookies } from "@decocms/apps-shopify/utils/cookies";
import { withABTesting } from "@decocms/blocks/sdk/abTesting";

const serverEntry = createServerEntry({ fetch: handler.fetch });

const CSP_DIRECTIVES = [
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.shopify.com *.shopify.com",
  "img-src 'self' data: blob: cdn.shopify.com *.shopify.com *.myshopify.com",
  "connect-src 'self' *.myshopify.com cdn.shopify.com",
  "frame-src 'self' *.shopify.com",
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com data:",
  // TODO: Add site-specific domains (analytics, CDN, tag managers)
];

const decoWorker = createDecoWorkerEntry(serverEntry, {
  // Opt out of the auto-wrap the framework (6.6.0+) applies inside
  // createDecoWorkerEntry. We keep the manual `instrumentWorker(decoWorker)`
  // wrap at the bottom of this file as the outermost layer. Without
  // `observability: false` we'd double-wrap and reinitialize the OTel SDK
  // twice per request. Manual wrap is the proven path on every tanstack site
  // that emits today.
  observability: false,

  admin: {
    handleMeta,
    handleDecofileRead,
    handleDecofileReload,
    handleRender,
    corsHeaders,
  },

  csp: CSP_DIRECTIVES,

  buildSegment: (request) => {
    const cookies = getCookies(request.headers);
    const rawDevice = detectDevice(request.headers.get("user-agent") ?? "");
    // SegmentKey only splits mobile vs desktop — collapse tablet to mobile
    const device: "mobile" | "desktop" =
      rawDevice === "desktop" ? "desktop" : "mobile";

    // Region splits the cache so a RJ-cached response isn't served to SP
    // visitors when pages use the website/matchers/location.ts matcher.
    // Reads cf-region-code (Cloudflare adds this in prod) with request.cf
    // as a fallback for environments that drop the header.
    const cf = (request as unknown as { cf?: { regionCode?: string } }).cf;
    const regionCode =
      request.headers.get("cf-region-code") ?? cf?.regionCode ?? "";

    return {
      device,
      ...(cookies.customerAccessToken ? { loggedIn: true } : {}),
      ...(regionCode ? { regionId: regionCode } : {}),
    };
  },

  // Shopify storefront needs no upstream proxy — checkout is hosted by Shopify
  // and the Storefront API is called server-side from loaders. Leaving
  // proxyHandler unset keeps all routes going through TanStack Start.
});

// ---------------------------------------------------------------------------
// A/B wrapper — KV-driven traffic split between the TanStack worker and a
// legacy fallback origin during the migration period.
//
// Reads config from KV (binding below) keyed by hostname. When the binding is
// absent, or KV has no config for the host, ALL traffic passes straight to the
// worker (no split). So this is safe to ship before SITES_KV exists — to
// actually enable A/B, add the `SITES_KV` binding in wrangler.jsonc and a
// per-host config: { "workerName": "...", "fallbackOrigin": "...",
// "abTest": { "ratio": 0.5 } }.
// ---------------------------------------------------------------------------

const abTestedWorker = withABTesting(decoWorker, {
  kvBinding: "SITES_KV",
});

// instrumentWorker MUST be the outermost wrapper. It initialises the OTel
// pipeline (metrics buffering, error log direct-POST) and reads
// DECO_OTEL_METRICS_ENDPOINT + DECO_OTEL_LOGS_ENDPOINT from env at boot.
const instrumentedWorker = instrumentWorker(abTestedWorker);

// --- Workers Cache experiment probe (TEMPORARY) ---------------------------
// Isolated route to prove whether Cloudflare Workers Cache (cache.enabled)
// skips the Worker on a hit. Intercepted at the OUTERMOST layer, so it is the
// only route that opts out of the framework's `no-store` default — the rest of
// the site is untouched (still no-store, still segment-safe). On a Workers
// Cache hit this handler never runs at all.
//
//   `x-ran-at` is unique per Worker execution:
//     - frozen across repeated GET /cache-probe   -> Worker was SKIPPED (cached)
//     - changing on GET /cache-probe?bust=<rnd>    -> Worker RAN (cache MISS)
//
// Remove this block once the experiment is done.
export default {
  async fetch(
    request: Request,
    env: unknown,
    ctx: unknown,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/cache-probe") {
      const ranAt = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      return new Response(
        JSON.stringify({ ranAt, at: new Date().toISOString(), q: url.search }, null, 2),
        {
          headers: {
            "content-type": "application/json",
            "x-ran-at": ranAt,
            // Cacheable so Workers Cache is allowed to store it (120s).
            "cache-control": "public, max-age=120",
            "cdn-cache-control": "public, max-age=120",
            // Cache-Tag must be present at store time for tag-based purge.
            "cache-tag": "probe",
          },
        },
      );
    }

    // Purge endpoint — proves ctx.cache.purge() invalidates the Workers Cache
    // without a redeploy. Runs from inside the Worker (ctx.cache is the
    // Worker's own cache). Modes: ?tag=<t> | ?prefix=</p> | ?all=1 (default tag=probe).
    //
    // Safety: unauthenticated calls are limited to purging the test tag
    // `probe` (only /cache-probe is cacheable, so this is harmless). Any other
    // scope (arbitrary tags, prefixes, purgeEverything) requires the
    // CACHE_PURGE_TOKEN secret via ?token= — fail-closed if unset.
    if (url.pathname === "/cache-purge") {
      const q = url.searchParams;
      const secret = (env as { CACHE_PURGE_TOKEN?: string }).CACHE_PURGE_TOKEN;
      const provided = q.get("token") ?? request.headers.get("x-purge-token") ?? "";
      const authed = !!secret && provided === secret;

      let arg: { tags?: string[]; pathPrefixes?: string[]; purgeEverything?: boolean };
      if (q.get("all")) arg = { purgeEverything: true };
      else if (q.get("prefix")) arg = { pathPrefixes: q.get("prefix")!.split(",") };
      else if (q.get("tag")) arg = { tags: q.get("tag")!.split(",") };
      else arg = { tags: ["probe"] };

      const isTestOnly =
        Array.isArray(arg.tags) && arg.tags.length === 1 && arg.tags[0] === "probe";
      if (!isTestOnly && !authed) {
        return Response.json(
          { error: "unauthorized: this scope needs ?token=<CACHE_PURGE_TOKEN>" },
          { status: 403, headers: { "cache-control": "no-store" } },
        );
      }

      const result = await (
        ctx as { cache: { purge: (o: unknown) => Promise<unknown> } }
      ).cache.purge(arg);
      return Response.json(
        { purged: arg, authed, result },
        { headers: { "cache-control": "no-store" } },
      );
    }

    return (
      instrumentedWorker as unknown as {
        fetch: (r: Request, e: unknown, c: unknown) => Response | Promise<Response>;
      }
    ).fetch(request, env, ctx);
  },
};
