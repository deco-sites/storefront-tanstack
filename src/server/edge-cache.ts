/**
 * The site's Cloudflare Worker wrapper: security headers, page cache headers and an edge cache in
 * front of TanStack Start. In v7 this was `createDecoWorkerEntry` from @decocms/tanstack; in the next
 * major the framework ships no page cache (/next/caching), so the site owns it. The behavior is v7's:
 *
 * - every HTML response gets the security headers and the Content-Security-Policy-Report-Only list;
 * - a page's profile (src/server/cache-profiles.ts) sets its Cache-Control, and public pages are kept
 *   in the Cache API under a key split by device, login state and region (`buildSegment`), with
 *   stale-while-revalidate and stale-if-error;
 * - responses that set a private cookie or say `Cache-Control: private`/`no-store`, logged-in
 *   visitors, drafts and non-GET requests bypass it;
 * - a GET server function is cached only when it loads a page (its payload carries the page path,
 *   as `loadPage`'s does); every other one (cart, user, wishlist, addresses, the layout) is private;
 * - v7's admin endpoints (`/deco/*`, `/live/*`, `/.decofile`) don't exist any more and answer 404;
 * - fingerprinted assets are served as immutable;
 * - the cache key's `__v` (and the X-Cache-Version header) is `<build>.<revision>`: the build's
 *   timestamp and the content revision this instance serves, or the build alone when the revision
 *   can't be read;
 * - `POST /_cache/purge` with `Authorization: Bearer $PURGE_TOKEN` drops paths from the cache (the
 *   current revision's entries);
 * - every HTML response may be framed by deco Studio — the site editor's preview — and by nothing
 *   else, through `Content-Security-Policy: frame-ancestors` (no `X-Frame-Options`), as v7 does;
 * - every response the worker sends without a CDN-Cache-Control, or with `X-Cache: BYPASS`, gets
 *   `CDN-Cache-Control: no-store`, so Cloudflare's own CDN never caches what this wrapper didn't;
 * - `vite dev` skips the edge cache, so a content edit shows on the next load.
 */
import { cms } from "../cms";
import {
  type CacheProfileName,
  cacheHeaders,
  canonicalizeServerFnPayload,
  detectCacheProfile,
  edgeCacheConfig,
  serverFnPagePath,
} from "./cache-profiles";

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type Env = Record<string, unknown>;

interface Handler {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response>;
}

/** What splits the cache: device, login state and region. */
export interface SegmentKey {
  device: "mobile" | "desktop";
  loggedIn?: boolean;
  regionId?: string;
}

export interface EdgeCacheOptions {
  buildSegment: (request: Request) => SegmentKey;
  /** Content-Security-Policy-Report-Only directives, joined with "; ". */
  csp: string[];
  /** The stylesheet every page preloads through a Link header. */
  cssHref?: string;
  /** Cookies a cacheable response may set: they're stripped from the stored copy. */
  safeCookies?: string[];
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
};

/**
 * Who may frame the site: deco Studio, whose site editor previews the storefront in an iframe (v7's
 * `DECO_ADMIN_FRAME_ANCESTORS`), plus a Studio running on this machine in `vite dev`. Sent on every
 * HTML response as an enforced `Content-Security-Policy: frame-ancestors`, with no
 * `X-Frame-Options`, as v7's `createDecoWorkerEntry` does (`DEFAULT_FRAME_ANCESTORS_CSP`): CSP
 * `frame-ancestors` supersedes X-Frame-Options and, unlike SAMEORIGIN, can allow Studio's origin
 * while refusing every other site.
 */
const FRAME_ANCESTORS = [
  "'self'",
  "https://studio.decocms.com",
  "https://*.deco.studio",
  ...(import.meta.env.DEV ? ["http://localhost:*", "http://127.0.0.1:*"] : []),
];

const PRIVATE_NO_CACHE = "private, no-cache, no-store, must-revalidate";
const BYPASS_PATHS = ["/_build"];
/**
 * v7's admin protocol paths. The next major serves no admin endpoints from the site (the hosted CMS
 * reads content itself, /next/hosted), so they're answered 404 here rather than falling through to the
 * catch-all page route as a cacheable category page.
 */
const REMOVED_ADMIN_PATHS = ["/deco/", "/live/", "/.decofile"];
const STATIC_PATHS = ["/fonts/"];
const FINGERPRINTED_ASSET_RE = /(?:\/_build)?\/assets\/.*-[a-zA-Z0-9_-]{8,}\.\w+$/;
/** Tracking params that never change a page, left out of its cache key (v7's list). */
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utmi_campaign",
  "utmi_page",
  "utmi_part",
  "fbclid",
  "gclid",
  "gclsrc",
  "dclid",
  "msclkid",
  "twclid",
  "li_fat_id",
  "mc_cid",
  "mc_eid",
  "ttclid",
  "srsltid",
]);
const DEFAULT_SAFE_COOKIES = [
  "vtex_is_session",
  "vtex_is_anonymous",
  "vtex_segment",
  "_deco_bucket",
];

declare const __BUILD_HASH__: string | undefined;

function buildHash(env: Env): string {
  const fromEnv = (env.BUILD_HASH as string) || "";
  if (fromEnv) return fromEnv;
  return typeof __BUILD_HASH__ !== "undefined" ? __BUILD_HASH__ : "";
}

/**
 * The cache version, `<build>.<revision>`: the build plus the content revision this instance serves,
 * read from the release client, so a newly published release gets new entries. When the revision
 * can't be read, the build alone.
 */
async function cacheVersion(env: Env): Promise<string> {
  const build = buildHash(env);
  let revision = "";
  try {
    revision = await cms.forRelease().revision();
  } catch {
    // The content didn't load: key on the build only.
  }
  return [build, revision].filter(Boolean).join(".");
}

function hashSegment(seg: SegmentKey): string {
  const parts: string[] = [seg.device];
  if (seg.loggedIn) parts.push("auth");
  if (seg.regionId) parts.push(`r=${seg.regionId}`);
  return parts.join("|");
}

function setCookieNames(response: Response): string[] {
  return response.headers
    .getSetCookie()
    .map((c) => c.slice(0, Math.max(0, c.indexOf("="))).trim())
    .filter(Boolean);
}

function hasOnlySafeCookies(response: Response, safe: Set<string>): boolean {
  return setCookieNames(response).every((name) => safe.has(name));
}

/** A copy for the cache without the safe cookies; the visitor still gets them. */
function withoutSafeCookies(response: Response, safe: Set<string>): Response {
  const copy = response.clone();
  const cookies = response.headers.getSetCookie();
  if (cookies.length === 0) return copy;
  copy.headers.delete("set-cookie");
  for (const c of cookies) {
    const name = c.slice(0, Math.max(0, c.indexOf("="))).trim();
    if (name && !safe.has(name)) copy.headers.append("set-cookie", c);
  }
  return copy;
}

/** Keeps the last Set-Cookie of each name: several layers may set the same cookie. */
function dedupeSetCookies(response: Response): void {
  const cookies = response.headers.getSetCookie();
  if (cookies.length <= 1) return;
  const last = new Map<string, string>();
  for (const c of cookies) last.set(c.slice(0, Math.max(0, c.indexOf("="))).trim() || c, c);
  if (last.size === cookies.length) return;
  response.headers.delete("set-cookie");
  for (const c of last.values()) response.headers.append("set-cookie", c);
}

/** A draft preview (`?__draft=` or the draft cookie, read the framework's way): never cached. */
async function isDraft(request: Request, url: URL): Promise<boolean> {
  return url.searchParams.has("__draft") || (await cms.draftPointer(request)) !== null;
}

function isServerFn(url: URL): boolean {
  return url.pathname.startsWith("/_serverFn/") || url.pathname.startsWith("/_server/");
}

/** The origin said the response is per-visitor. */
function isPrivateResponse(response: Response): boolean {
  return /\b(private|no-store)\b/i.test(response.headers.get("cache-control") ?? "");
}

export function withEdgeCache(serverEntry: Handler, options: EdgeCacheOptions): Handler {
  const safeCookies = new Set(options.safeCookies ?? DEFAULT_SAFE_COOKIES);
  const securityHeaders: Record<string, string> = {
    ...SECURITY_HEADERS,
    "Content-Security-Policy": `frame-ancestors ${FRAME_ANCESTORS.join(" ")}`,
    ...(options.csp.length > 0
      ? { "Content-Security-Policy-Report-Only": options.csp.join("; ") }
      : {}),
  };

  function profileOf(url: URL): CacheProfileName {
    if (isServerFn(url)) {
      // Only a page load is shared between visitors; any other server function reads per-visitor
      // state (cart, user, wishlist, addresses) and is never cached, whatever it returns.
      const pagePath = serverFnPagePath(url);
      return pagePath ? detectCacheProfile(new URL(pagePath, url.origin)) : "private";
    }
    return detectCacheProfile(url);
  }

  function appendResourceHints(response: Response): void {
    if (!options.cssHref || !(response.headers.get("content-type") ?? "").includes("text/html"))
      return;
    response.headers.append("Link", `<${options.cssHref}>; rel=preload; as=style`);
  }

  function cacheKey(request: Request, version: string, segment: SegmentKey): Request {
    const url = new URL(request.url);
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    if (isServerFn(url)) {
      const payload = url.searchParams.get("payload");
      if (payload) url.searchParams.set("payload", canonicalizeServerFnPayload(payload));
    }
    if (version) url.searchParams.set("__v", version);
    // Programmatic fetches (no navigation) get their own entries, as in v7.
    if (!isServerFn(url) && request.headers.get("sec-fetch-dest") === "empty")
      url.searchParams.set("__fetch", "1");
    url.searchParams.set("__seg", hashSegment(segment));
    return new Request(url.toString(), { method: "GET" });
  }

  function edgeCache(): Cache | null {
    return typeof caches !== "undefined"
      ? ((caches as unknown as { default?: Cache }).default ?? null)
      : null;
  }

  async function purge(request: Request, env: Env): Promise<Response> {
    const token = (env.PURGE_TOKEN as string) || "";
    if (!token || request.headers.get("Authorization") !== `Bearer ${token}`) {
      return new Response("Unauthorized", { status: 401 });
    }
    let body: { paths?: string[]; regionIds?: string[] };
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }
    if (!Array.isArray(body.paths) || body.paths.length === 0) {
      return new Response('Body must include "paths": ["/", "/page"]', { status: 400 });
    }
    const cache = edgeCache();
    if (!cache) return Response.json({ purged: [], total: 0, note: "Cache API unavailable" });
    const segments: SegmentKey[] = [];
    for (const device of ["mobile", "desktop"] as const) {
      for (const regionId of [undefined, ...(body.regionIds ?? [])])
        segments.push({ device, regionId });
    }
    const purged: string[] = [];
    const origin = new URL(request.url).origin;
    // The current revision's entries: older revisions' keys are no longer looked up.
    const version = await cacheVersion(env);
    for (const path of body.paths) {
      for (const segment of segments) {
        for (const programmatic of [false, true]) {
          const url = new URL(path, origin);
          if (version) url.searchParams.set("__v", version);
          if (programmatic) url.searchParams.set("__fetch", "1");
          url.searchParams.set("__seg", hashSegment(segment));
          if (await cache.delete(new Request(url.toString(), { method: "GET" }))) {
            purged.push(
              `${path} (${[hashSegment(segment), programmatic ? "fetch" : null].filter(Boolean).join(", ")})`,
            );
          }
        }
      }
    }
    return Response.json({ purged, total: purged.length });
  }

  async function handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_cache/purge" && request.method === "POST") return purge(request, env);

    if (REMOVED_ADMIN_PATHS.some((p) => url.pathname.startsWith(p))) {
      return new Response("Not Found", {
        status: 404,
        headers: { "Cache-Control": PRIVATE_NO_CACHE, "X-Cache": "BYPASS" },
      });
    }

    if (
      FINGERPRINTED_ASSET_RE.test(url.pathname) ||
      STATIC_PATHS.some((p) => url.pathname.startsWith(p))
    ) {
      const origin = await serverEntry.fetch(request, env, ctx);
      if (origin.status !== 200) return origin;
      if ((origin.headers.get("content-type") ?? "").includes("text/html"))
        return new Response("Not Found", { status: 404 });
      const resp = new Response(origin.body, origin);
      resp.headers.set("Cache-Control", "public, max-age=31536000, immutable");
      resp.headers.set("Vary", "Accept-Encoding");
      return resp;
    }

    const profile = profileOf(url);
    const cacheable =
      !import.meta.env.DEV &&
      request.method === "GET" &&
      !BYPASS_PATHS.some((p) => url.pathname.startsWith(p)) &&
      !(await isDraft(request, url));
    // A private profile still goes through the path below, which never stores it (`edge.isPublic`
    // is false) and never serves it from the cache: only public profiles are looked up.

    if (!cacheable) {
      const origin = await serverEntry.fetch(request, env, ctx);
      const resp = new Response(origin.body, origin);
      if (request.method !== "GET") {
        // Server function calls (cart, sign-in) are never cached.
        resp.headers.set("X-Cache", "BYPASS");
        return resp;
      }
      if (
        profile === "private" ||
        profile === "none" ||
        profile === "cart" ||
        isPrivateResponse(origin)
      ) {
        resp.headers.set("Cache-Control", PRIVATE_NO_CACHE);
        resp.headers.delete("CDN-Cache-Control");
        resp.headers.set("X-Cache", "BYPASS");
        return resp;
      }
      if (origin.headers.has("set-cookie") && !hasOnlySafeCookies(origin, safeCookies)) {
        resp.headers.set("Cache-Control", PRIVATE_NO_CACHE);
        resp.headers.delete("CDN-Cache-Control");
        resp.headers.set("X-Cache", "BYPASS");
        return resp;
      }
      for (const [k, v] of Object.entries(cacheHeaders(profile))) resp.headers.set(k, v);
      resp.headers.set("X-Cache", "BYPASS");
      resp.headers.set("X-Cache-Profile", profile);
      return resp;
    }

    const segment = options.buildSegment(request);
    if (segment.loggedIn) {
      const origin = await serverEntry.fetch(request, env, ctx);
      const resp = new Response(origin.body, origin);
      resp.headers.set("Cache-Control", PRIVATE_NO_CACHE);
      resp.headers.set("X-Cache", "BYPASS");
      return resp;
    }

    const version = await cacheVersion(env);
    const key = cacheKey(request, version, segment);
    const cache = edgeCache();
    const edge = edgeCacheConfig(profile);

    const dress = (resp: Response, xCache: string, extra?: Record<string, string>): Response => {
      const out = new Response(resp.body, resp);
      for (const [k, v] of Object.entries(cacheHeaders(profile))) out.headers.set(k, v);
      out.headers.set("CDN-Cache-Control", "no-store");
      out.headers.set("X-Cache", xCache);
      out.headers.set("X-Cache-Profile", profile);
      out.headers.set("X-Cache-Segment", hashSegment(segment));
      if (version) out.headers.set("X-Cache-Version", version);
      if (extra) for (const [k, v] of Object.entries(extra)) out.headers.set(k, v);
      appendResourceHints(out);
      return out;
    };

    const store = (resp: Response) => {
      if (!cache) return;
      const ttl = edge.fresh + Math.max(edge.swr, edge.sie);
      const copy = resp.clone();
      copy.headers.set("Cache-Control", `public, max-age=${ttl}`);
      copy.headers.set("X-Deco-Stored-At", String(Date.now()));
      copy.headers.delete("CDN-Cache-Control");
      ctx.waitUntil(cache.put(key, copy).catch(() => {}));
    };

    const ageOf = (resp: Response) => {
      const storedAt = Number(resp.headers.get("X-Deco-Stored-At") || "0");
      return storedAt > 0 ? (Date.now() - storedAt) / 1000 : Infinity;
    };

    let cached: Response | undefined;
    if (cache) {
      try {
        cached = (await cache.match(key)) ?? undefined;
      } catch {
        // Cache API unavailable
      }
    }

    if (cached && edge.isPublic && edge.fresh > 0) {
      const age = ageOf(cached);
      if (age < edge.fresh) return dress(cached, "HIT");
      if (age < edge.fresh + edge.swr) {
        ctx.waitUntil(
          Promise.resolve(serverEntry.fetch(request, env, ctx))
            .then((origin) => {
              if (
                origin.status === 200 &&
                !isPrivateResponse(origin) &&
                hasOnlySafeCookies(origin, safeCookies)
              ) {
                store(
                  origin.headers.has("set-cookie")
                    ? withoutSafeCookies(origin, safeCookies)
                    : origin,
                );
              }
            })
            .catch(() => {}),
        );
        return dress(cached, "STALE-HIT", { "X-Cache-Age": String(Math.round(age)) });
      }
    }

    const staleOnError = (status?: number): Response | null => {
      if (!cached || edge.sie <= 0) return null;
      const age = ageOf(cached);
      if (age >= edge.fresh + edge.sie) return null;
      return dress(cached, "STALE-ERROR", {
        "X-Cache-Age": String(Math.round(age)),
        ...(status ? { "X-Cache-Origin-Status": String(status) } : {}),
      });
    };

    let origin: Response;
    try {
      origin = await serverEntry.fetch(request, env, ctx);
    } catch (error) {
      const stale = staleOnError();
      if (stale) return stale;
      throw error;
    }

    if (origin.status !== 200) {
      if (origin.status >= 500 || origin.status === 429) {
        const stale = staleOnError(origin.status);
        if (stale) return stale;
      }
      const resp = new Response(origin.body, origin);
      resp.headers.set("X-Cache", "BYPASS");
      appendResourceHints(resp);
      return resp;
    }

    if (
      isPrivateResponse(origin) ||
      (origin.headers.has("set-cookie") && !hasOnlySafeCookies(origin, safeCookies))
    ) {
      const resp = new Response(origin.body, origin);
      resp.headers.set("Cache-Control", PRIVATE_NO_CACHE);
      resp.headers.delete("CDN-Cache-Control");
      resp.headers.set("X-Cache", "BYPASS");
      appendResourceHints(resp);
      return resp;
    }

    if (!edge.isPublic || edge.fresh === 0) {
      const resp = new Response(origin.body, origin);
      resp.headers.set("Cache-Control", PRIVATE_NO_CACHE);
      resp.headers.set("X-Cache", "BYPASS");
      appendResourceHints(resp);
      return resp;
    }

    store(origin.headers.has("set-cookie") ? withoutSafeCookies(origin, safeCookies) : origin);
    return dress(origin, "MISS");
  }

  return {
    async fetch(request, env, ctx) {
      let response = await handle(request, env, ctx);
      // CDN-Cache-Control is decided here, at the single exit, as v7 does: a response the wrapper
      // declined to cache (`X-Cache: BYPASS`) or that no branch gave one (a private page such as
      // /login or /account, a server function, a redirect, an asset) tells the CDN `no-store`. Only
      // the cacheable path's own value (`dress`) is kept.
      if (
        response.headers.get("X-Cache") === "BYPASS" ||
        !response.headers.has("CDN-Cache-Control")
      ) {
        try {
          response.headers.set("CDN-Cache-Control", "no-store");
        } catch {
          // Immutable headers (a response passed through as fetched): copy it first.
          response = new Response(response.body, response);
          response.headers.set("CDN-Cache-Control", "no-store");
        }
      }
      dedupeSetCookies(response);
      if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;
      const out = new Response(response.body, response);
      for (const [k, v] of Object.entries(securityHeaders)) {
        if (!out.headers.has(k)) out.headers.set(k, v);
      }
      return out;
    },
  };
}
