/**
 * Page cache profiles, owned by the site (in v7 they came from @decocms/blocks/sdk/cacheHeaders).
 * A profile decides the Cache-Control a page is sent with and how long the worker keeps it in the
 * edge cache (src/server/edge-cache.ts). The values and URL rules are v7's, unchanged.
 */
export type CacheProfileName =
  | "static"
  | "product"
  | "listing"
  | "search"
  | "cart"
  | "private"
  | "none";

interface Window {
  /** Seconds the response is fresh. */
  fresh: number;
  /** Seconds a stale response is still served while it revalidates. */
  swr: number;
  /** Seconds a stale response is served when the origin fails. */
  sie: number;
}

interface CacheProfile {
  edge: Window;
  browser: Window;
  isPublic: boolean;
}

const NO_CACHE: CacheProfile = {
  edge: { fresh: 0, swr: 0, sie: 0 },
  browser: { fresh: 0, swr: 0, sie: 0 },
  isPublic: false,
};

const PROFILES: Record<CacheProfileName, CacheProfile> = {
  static: {
    edge: { fresh: 900, swr: 7200, sie: 21600 },
    browser: { fresh: 120, swr: 1800, sie: 7200 },
    isPublic: true,
  },
  product: {
    edge: { fresh: 300, swr: 1800, sie: 7200 },
    browser: { fresh: 60, swr: 600, sie: 3600 },
    isPublic: true,
  },
  listing: {
    edge: { fresh: 120, swr: 900, sie: 3600 },
    browser: { fresh: 30, swr: 300, sie: 1800 },
    isPublic: true,
  },
  search: {
    edge: { fresh: 60, swr: 300, sie: 1800 },
    browser: { fresh: 0, swr: 120, sie: 600 },
    isPublic: true,
  },
  cart: NO_CACHE,
  private: NO_CACHE,
  none: NO_CACHE,
};

export function edgeCacheConfig(profile: CacheProfileName): Window & { isPublic: boolean } {
  const p = PROFILES[profile];
  return { ...p.edge, isPublic: p.isPublic };
}

/** The response headers for a profile. */
export function cacheHeaders(profile: CacheProfileName): Record<string, string> {
  const p = PROFILES[profile];
  if (!p.isPublic || (p.edge.fresh === 0 && p.browser.fresh === 0)) {
    return { "Cache-Control": "private, no-cache, no-store, must-revalidate" };
  }
  const parts = ["public", p.browser.fresh > 0 ? `max-age=${p.browser.fresh}` : "max-age=0"];
  if (p.edge.fresh > 0) parts.push(`s-maxage=${p.edge.fresh}`);
  if (p.browser.swr > 0) parts.push(`stale-while-revalidate=${p.browser.swr}`);
  if (p.browser.sie > 0) parts.push(`stale-if-error=${p.browser.sie}`);
  return { "Cache-Control": parts.join(", "), Vary: "Accept-Encoding" };
}

const PRIVATE_PREFIX_RE = /^\/(cart|checkout|account|login|my-account)(\/|$)/;

/** The profile of a page URL (a path with an optional query string, or a URL). */
export function detectCacheProfile(pathnameOrUrl: string | URL): CacheProfileName {
  const url =
    typeof pathnameOrUrl === "string" ? new URL(pathnameOrUrl, "http://localhost") : pathnameOrUrl;
  const p = url.pathname;
  if (PRIVATE_PREFIX_RE.test(p)) return "private";
  if (p.startsWith("/api/") || p.startsWith("/deco/") || p.startsWith("/_build")) return "none";
  if (p === "/s" || p.startsWith("/s/") || url.searchParams.has("q")) return "search";
  if (p.endsWith("/p")) return "product";
  if (p === "/" || p === "") return "static";
  return "listing";
}

/** The page a GET server-function request loads, from its payload: the first string that is a path. */
export function serverFnPagePath(url: URL): string | null {
  if (!url.pathname.startsWith("/_serverFn/") && !url.pathname.startsWith("/_server/")) return null;
  const payload = url.searchParams.get("payload");
  if (!payload) return null;
  try {
    let found: string | null = null;
    const visit = (v: unknown): void => {
      if (found !== null) return;
      if (typeof v === "string") {
        if (v.startsWith("/") && !v.startsWith("//")) found = v;
      } else if (Array.isArray(v)) {
        for (const x of v) visit(x);
      } else if (v && typeof v === "object") {
        for (const x of Object.values(v)) visit(x);
      }
    };
    visit(JSON.parse(payload));
    return found;
  } catch {
    return null;
  }
}

/** Variant params a page loader ignores, left out of a server function's cache key. */
const SERVER_FN_IGNORED_PARAMS = ["skuId", "idsku"];

export function canonicalizeServerFnPayload(payload: string): string {
  try {
    const stripQuery = (s: string): string => {
      if (!s.startsWith("/") || s.startsWith("//")) return s;
      const q = s.indexOf("?");
      if (q < 0) return s;
      const sp = new URLSearchParams(s.slice(q + 1));
      for (const p of SERVER_FN_IGNORED_PARAMS) sp.delete(p);
      const rest = sp.toString();
      return rest ? `${s.slice(0, q)}?${rest}` : s.slice(0, q);
    };
    const visit = (v: unknown): unknown => {
      if (typeof v === "string") return stripQuery(v);
      if (Array.isArray(v)) return v.map(visit);
      if (v && typeof v === "object")
        return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, visit(x)]));
      return v;
    };
    return JSON.stringify(visit(JSON.parse(payload)));
  } catch {
    return payload;
  }
}
