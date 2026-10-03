/**
 * Cloudflare Worker entry point — Shopify storefront.
 *
 * TanStack Start serves every page; the site's edge-cache wrapper (src/server/edge-cache.ts) adds
 * security headers, page cache headers and the edge cache in front of it. Shopify checkout runs on
 * Shopify's hosted checkout, so there's no upstream proxy.
 *
 * MANUAL REVIEW: Add site-specific CSP domains (analytics, CDN, tag managers).
 */
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { withEdgeCache } from "./server/edge-cache";
import { detectDevice } from "./sdk/device";
import { getCookies } from "./vendor/shopify/utils/cookies";
// @ts-ignore Vite ?url import
import appCss from "./styles/app.css?url";

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

export default withEdgeCache(serverEntry, {
  csp: CSP_DIRECTIVES,
  cssHref: appCss,
  buildSegment: (request) => {
    const cookies = getCookies(request.headers);
    // The cache splits only mobile vs desktop: tablets share the mobile entry.
    const device =
      detectDevice(request.headers.get("user-agent") ?? "") === "desktop" ? "desktop" : "mobile";
    // Region splits the cache so a page cached for one region isn't served to another. Reads
    // cf-region-code (Cloudflare adds it in production), with request.cf as a fallback.
    const cf = (request as unknown as { cf?: { regionCode?: string } }).cf;
    const regionCode = request.headers.get("cf-region-code") ?? cf?.regionCode ?? "";
    return {
      device,
      ...(cookies.customerAccessToken ? { loggedIn: true } : {}),
      ...(regionCode ? { regionId: regionCode } : {}),
    };
  },
});
