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

import "./setup";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { createDecoWorkerEntry } from "@decocms/start/sdk/workerEntry";
import { instrumentWorker } from "@decocms/start/sdk/otel";
import {
  handleMeta,
  handleDecofileRead,
  handleDecofileReload,
  handleRender,
  corsHeaders,
} from "@decocms/start/admin";
import {
  shouldProxyToVtex,
  createVtexCheckoutProxy,
} from "@decocms/apps/vtex/utils/proxy";
import {
  createVtexSitemapProxy,
  isVtexSitemapPath,
} from "@decocms/apps/vtex/utils/sitemap";
import { extractVtexContext } from "@decocms/apps/vtex/middleware";
import { loadRedirects, matchRedirect } from "@decocms/start/sdk/redirects";
import { withABTesting } from "@decocms/start/sdk/abTesting";
import { loadBlocks } from "@decocms/start/cms";

// ---------------------------------------------------------------------------
// VTEX sitemap proxy — exposes /sitemap.xml + /sitemap/* from VTEX so
// crawlers (declared in robots.txt) get a real sitemap instead of a 404.
// `sitemap-busca.xml` is a static, site-managed search-results index.
// ---------------------------------------------------------------------------

const STORAGE_ORIGIN = "https://storage.googleapis.com";
const COLLECTIONS_SITEMAP_PUBLIC_PATH = "/collections-sitemap.xml";
const COLLECTIONS_SITEMAP_STORAGE_PATH =
  "/storage.lebiscuit.io/storage/workflows/collections-sitemap/cev/sitemap.xml";

const proxySitemap = createVtexSitemapProxy({
  extraSitemaps: [COLLECTIONS_SITEMAP_PUBLIC_PATH],
});

const isCollectionsSitemapPath = (pathname: string) =>
  pathname === COLLECTIONS_SITEMAP_PUBLIC_PATH;

const proxyCollectionsSitemap = async (request: Request, url: URL) => {
  if (!isCollectionsSitemapPath(url.pathname)) return null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const target = new URL(COLLECTIONS_SITEMAP_STORAGE_PATH, STORAGE_ORIGIN);
  target.search = url.search;

  return fetch(target, {
    method: request.method,
    headers: {
      accept: request.headers.get("accept") ?? "application/xml",
    },
  });
};

// ---------------------------------------------------------------------------
// VTEX checkout proxy — configured via @decocms/apps factory
// ---------------------------------------------------------------------------

const CHECKOUT_ORIGIN = "secure.casaevideo.com.br";

const proxyCheckout = createVtexCheckoutProxy({
  account: "casaevideonewio",
  checkoutOrigin: CHECKOUT_ORIGIN,
  expireCookiesOnPaths: [
    { pathPrefix: "/api/vtexid/pub/logout", cookies: ["checkout.vtex.com"] },
  ],
  htmlTransform: (html) =>
    html.replace(
      "</head>",
      `<style>html,body{min-height:100vh!important;display:flex!important;flex-direction:column!important}body>*{flex-shrink:0}div#geralFooter,div.container--geral-footer{margin-top:auto!important}</style></head>`,
    ),
});

function getOrderFormId(request: Request): string | null {
  return (
    (request.headers.get("cookie") ?? "").match(
      /checkout\.vtex\.com__orderFormId=([^;]+)/i,
    )?.[1] ?? null
  );
}

// Returns true when checkout.vtex.com cookies don't all match orderFormId.
function verifyCurrentValueIsBroken(request: Request): boolean {
  const cookies = request.headers.get("cookie") ?? "";
  const orderFormId = getOrderFormId(request);
  if (!orderFormId) return false;

  const currentValues = [
    ...cookies.matchAll(/checkout\.vtex\.com=(?:__ofid=)?([^;]+)/gi),
  ].map((m) => m[1].replace(/^__ofid=/i, ""));
  return (
    currentValues.length === 0 || !currentValues.every((v) => v === orderFormId)
  );
}

// Rewrites checkout.vtex.com cookie in outgoing request to match orderFormId.
function fixCheckoutCookieRequest(request: Request): Request {
  const cookies = request.headers.get("cookie") ?? "";
  const orderFormId = getOrderFormId(request);
  if (!orderFormId) return request;

  const currentValues = [
    ...cookies.matchAll(/checkout\.vtex\.com=(?:__ofid=)?([^;]+)/gi),
  ].map((m) => m[1].replace(/^__ofid=/i, ""));
  if (currentValues.length > 0 && currentValues.every((v) => v === orderFormId))
    return request;

  const fixed =
    currentValues.length === 0
      ? [cookies, `checkout.vtex.com=__ofid=${orderFormId}`]
          .filter(Boolean)
          .join("; ")
      : cookies.replace(
          /checkout\.vtex\.com=(?:__ofid=)?[^;]*/gi,
          `checkout.vtex.com=__ofid=${orderFormId}`,
        );
  const newHeaders = new Headers(request.headers);
  newHeaders.set("cookie", fixed);
  return new Request(request, { headers: newHeaders });
}

// Rewrites checkout.vtex.com Set-Cookie in response to match orderFormId.
// Always called when a mismatch was detected — rewrites existing Set-Cookie
// or injects a new one when VTEX doesn't include it in the response.
function fixCheckoutCookieResponse(
  res: Response,
  orderFormId: string,
  host: string,
): Response {
  const allHeaders = [...res.headers] as [string, string][];
  const newHeaders = new Headers();
  let rewroteExisting = false;

  for (const [k, v] of allHeaders) {
    if (k === "set-cookie" && /^checkout\.vtex\.com=/.test(v)) {
      newHeaders.append(
        k,
        v.replace(
          /^(checkout\.vtex\.com=)(?:__ofid=)?[^;]*/,
          `$1__ofid=${orderFormId}`,
        ),
      );
      rewroteExisting = true;
    } else {
      newHeaders.append(k, v);
    }
  }

  // VTEX didn't include checkout.vtex.com in Set-Cookie — add it so the
  // browser updates to the correct value after the request was fixed.
  if (!rewroteExisting) {
    newHeaders.append(
      "set-cookie",
      `checkout.vtex.com=__ofid=${orderFormId}; Path=/; Secure; SameSite=Lax`,
    );
  }

  // TODO: temporary — force-expire stale checkout.vtex.com cookies that may
  // linger in the browser from before this fix was deployed. Remove once all
  // clients have cycled through at least one corrected response.
  newHeaders.append(
    "set-cookie",
    `checkout.vtex.com=; Path=/; Max-Age=0; Domain=${host}; Secure; SameSite=Lax`,
  );
  newHeaders.append(
    "set-cookie",
    `checkout.vtex.com=; Path=/; Max-Age=0; Domain=.${host}; Secure; SameSite=Lax`,
  );

  // JS-readable signal cookie (short TTL) for analytics tracking.
  newHeaders.append(
    "set-cookie",
    `__cv_cookie_error=1; Path=/; Max-Age=300; SameSite=Lax`,
  );

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });
}

// ---------------------------------------------------------------------------
// VTEX IO proxy — forwards every `/_v/*` path to casaevideonewio.myvtex.com.
// Pointing BOTH origins (checkout + api) at myvtex makes createVtexCheckoutProxy's
// internal routing send all /_v/* there regardless of method, while still
// reusing its header sanitization, Set-Cookie domain rewrite, and Location
// rewrite logic. Wired in proxyHandler ahead of proxyCheckout.
// ---------------------------------------------------------------------------

const MYVTEX_ORIGIN = "casaevideonewio.myvtex.com";

const proxyVtexIo = createVtexCheckoutProxy({
  account: "casaevideonewio",
  checkoutOrigin: MYVTEX_ORIGIN,
  apiOrigin: `https://${MYVTEX_ORIGIN}`,
});

// Site-specific CSP directives — third-party script domains vary per site.
// Security headers (HSTS, X-Frame-Options, etc.) and geo cookie injection
// are handled automatically by createDecoWorkerEntry.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://pagead2.googlesyndication.com https://td.doubleclick.net https://soureicdn.casaevideo.com.br https://storage.googleapis.com https://weni-sp-integrations-production.s3.amazonaws.com https://connect.facebook.net https://analytics.tiktok.com https://script.hotjar.com https://static.hotjar.com https://scripts.clarity.ms https://www.clarity.ms https://static.scarabresearch.com https://cdn.scarabresearch.com https://s.lilstts.com https://bat.bing.com https://tags.creativecdn.com https://cdn.pn.vg https://sp.vtex.com https://d.clarity.ms https://us.creativecdn.com https://cdn.pmweb.com.br https://client-version.cf.emarsys.net https://cdn.nizza.com https://*.nizza.com",
  "img-src 'self' data: https: blob:",
  "style-src 'self' 'unsafe-inline' https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https://www.googletagmanager.com https://td.doubleclick.net https://googleads.g.doubleclick.net https://www.googleadservices.com https://soureicdn.casaevideo.com.br https://*.pn.vg https://*.firebaseapp.com https://*.nizza.com",
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
];

const serverEntry = createServerEntry({ fetch: handler.fetch });

// ---------------------------------------------------------------------------
// CMS Redirects — loaded once at module level from .deco/blocks/
// ---------------------------------------------------------------------------
const cmsRedirects = loadRedirects(loadBlocks());

const MOBILE_RE = /mobile|android|iphone/i;

const decoWorker = createDecoWorkerEntry(serverEntry, {
  // Opt out of the auto-wrap that 6.6.0+ added inside createDecoWorkerEntry.
  // We keep the manual `instrumentWorker(abTestedWorker)` wrap at the bottom
  // of this file as the outermost layer. Without `observability: false` we'd
  // double-wrap and reinitialize the OTel SDK twice per request — the
  // failure mode that broke miess-tanstack metric POSTs on 2026-06-10.
  // Manual wrap is the proven path on every tanstack site that emits today.
  observability: false,
  csp: CSP_DIRECTIVES,
  // frame-ancestors must be in the enforcement CSP (not report-only) to actually
  // allow embedding. X-Frame-Options is ignored by browsers when CSP frame-ancestors
  // is present (CSP level 3 takes precedence in Chrome, Firefox, Safari, Edge).
  securityHeaders: {
    "Content-Security-Policy": [
      "frame-ancestors 'self'",
      "https://admin.deco.cx",
      "https://admin.decocms.com",
      "https://decocms.com",
      "https://*.decocms.com",
      "https://studio.decocms.com",
      "https://*.deco.studio",
      "https://deco.cx",
      "https://www.deco.cx",
      "https://play.deco.cx",
      "https://admin-cx.deco.page",
      "https://deco.chat",
      "http://localhost:*",
      "https://localhost:*",
    ].join(" "),
  },
  buildSegment: (request) => {
    const vtx = extractVtexContext(request);
    return {
      device: MOBILE_RE.test(request.headers.get("user-agent") ?? "")
        ? "mobile"
        : "desktop",
      loggedIn: vtx.isLoggedIn,
      salesChannel: vtx.salesChannel,
      regionId: (vtx as any).regionId ?? undefined,
    };
  },
  admin: {
    handleMeta,
    handleDecofileRead,
    handleDecofileReload,
    handleRender,
    corsHeaders,
  },
  proxyHandler: async (request, url) => {
    if (isCollectionsSitemapPath(url.pathname)) {
      return proxyCollectionsSitemap(request, url);
    }

    if (isVtexSitemapPath(url.pathname)) {
      return proxySitemap(request, url);
    }

    if (
      url.pathname === "/login" ||
      url.pathname === "/login/" ||
      url.pathname === "/logout" ||
      url.pathname === "/logout/"
    )
      return null;

    if (!shouldProxyToVtex(url.pathname)) return null;

    try {
      // Route every /_v/* path to casaevideonewio.myvtex.com before the checkout
      // cookie correction, because /_v/* is a VTEX IO/API route, not checkout.
      if (url.pathname.startsWith("/_v/")) {
        const proxyHeaders = new Headers(request.headers);
        proxyHeaders.set("origin", `https://${MYVTEX_ORIGIN}`);

        return await proxyVtexIo(
          new Request(request, { headers: proxyHeaders }),
          url,
        );
      }

      const vtexCheckoutCookieIsBroken = verifyCurrentValueIsBroken(request);
      const orderFormId = getOrderFormId(request);
      if (vtexCheckoutCookieIsBroken && orderFormId) {
        const fixedRequest = fixCheckoutCookieRequest(request);
        const res = await proxyCheckout(fixedRequest, url);
        return res
          ? fixCheckoutCookieResponse(
              res,
              orderFormId,
              new URL(request.url).hostname,
            )
          : res;
      }
      return await proxyCheckout(request, url);
    } catch (err) {
      console.error("[PROXY] Failed to proxy", url.pathname, err);
      return new Response(`Proxy error for ${url.pathname}: ${err}`, {
        status: 502,
        headers: { "content-type": "text/plain" },
      });
    }
  },
});

// ---------------------------------------------------------------------------
// A/B wrapper — KV-driven traffic split between TanStack and legacy origin
// ---------------------------------------------------------------------------

const abTestedWorker = withABTesting(decoWorker, {
  kvBinding: "SITES_KV",
  preHandler: (request, url) => {
    const redirect = matchRedirect(url.pathname, cmsRedirects);
    if (redirect) {
      const target = url.search ? `${redirect.to}${url.search}` : redirect.to;
      return new Response(null, {
        status: redirect.status,
        headers: { Location: target },
      });
    }
    return null;
  },
  shouldBypassAB: (_request, url) => {
    // Crawlers must always get a deterministic sitemap from the worker,
    // not from the legacy fallback origin.
    if (isCollectionsSitemapPath(url.pathname)) return true;
    if (isVtexSitemapPath(url.pathname)) return true;
    if (
      url.pathname === "/login" ||
      url.pathname === "/login/" ||
      url.pathname === "/logout" ||
      url.pathname === "/logout/"
    )
      return false;
    return shouldProxyToVtex(url.pathname);
  },
});

// instrumentWorker MUST be the outermost wrapper. It initialises the OTel
// pipeline (metrics buffering, error log direct-POST) and reads
// DECO_OTEL_METRICS_ENDPOINT + DECO_OTEL_LOGS_ENDPOINT from env at boot.
export default instrumentWorker(abTestedWorker);
