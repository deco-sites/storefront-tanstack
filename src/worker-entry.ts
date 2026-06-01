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
import { detectDevice } from "@decocms/start/sdk/useDevice";
import {
  handleMeta,
  handleDecofileRead,
  handleDecofileReload,
  handleRender,
  corsHeaders,
} from "@decocms/start/admin";
import { getCookies } from "@decocms/apps/shopify/utils/cookies";

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

    // Region segments the cache so a RJ-cached response isn't served to SP
    // visitors when pages use the website/matchers/location.ts matcher.
    // Priority: ?region= query string (manual override for testing/QA) >
    // cf-region-code header (Cloudflare adds this in prod) > request.cf.
    const url = new URL(request.url);
    const overrideRegion = url.searchParams.get("region");
    const cf = (request as unknown as { cf?: { regionCode?: string } }).cf;
    const regionCode =
      overrideRegion ??
      request.headers.get("cf-region-code") ??
      cf?.regionCode ??
      "";

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

/**
 * DEV/QA wrapper: when ?region=XX is in the URL, rewrite cf-region-code header
 * on the inbound request so BOTH the matcher (reads headers) and buildSegment
 * (reads ?region=) see the same value. Lets us simulate a region without VPN
 * even on trycloudflare quick-tunnels where workerd local injects only my IP.
 */
export default {
  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    const url = new URL(request.url);
    const overrideRegion = url.searchParams.get("region");
    if (overrideRegion) {
      const headers = new Headers(request.headers);
      headers.set("cf-region-code", overrideRegion);
      headers.set("cf-ipcountry", "BR");
      request = new Request(request, { headers });
    }
    return decoWorker.fetch(request, env as never, ctx as never);
  },
};
