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
import { createDecoWorkerEntry } from "@decocms/start/sdk/workerEntry";
import { instrumentWorker } from "@decocms/start/sdk/otel";
import { detectDevice } from "@decocms/start/sdk/useDevice";
import {
  handleMeta,
  handleDecofileRead,
  handleDecofileReload,
  handleRender,
  corsHeaders,
} from "@decocms/start/admin";
import { getCookies } from "@decocms/apps/shopify/utils/cookies";
import { withABTesting } from "@decocms/start/sdk/abTesting";

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
export default instrumentWorker(abTestedWorker);
