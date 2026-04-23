export const relative = (link?: string | undefined) => {
  const linkUrl = link ? new URL(link, "http://localhost") : undefined;
  const linkPath = linkUrl ? `${linkUrl.pathname}${linkUrl.search}` : undefined;
  return linkPath;
};

/**
 * Filter/sort/pagination URLs returned by commerce loaders sometimes carry the
 * wrong pathname/origin (e.g. Shopify's PLP loader falls back to
 * `https://localhost` when no page URL is forwarded). To stay safe across
 * platforms, keep the current page's pathname and only adopt the search
 * params built by the loader.
 */
const rebaseSearch = (
  loaderHref: string | undefined,
  basePath: string | undefined,
): string | undefined => {
  if (!loaderHref) return undefined;
  try {
    const next = new URL(loaderHref, "http://localhost");
    // Fall back to the loader's path when the base is missing/invalid —
    // better than producing "/undefined" via `new URL(undefined, …)`.
    const base = basePath
      ? new URL(basePath, "http://localhost")
      : { pathname: next.pathname };
    return `${base.pathname}${next.search}`;
  } catch {
    return undefined;
  }
};

/**
 * Same as `rebaseSearch`, but returns `{ to, search }` so callers can pass
 * them as separate props to TanStack Router's `<Link>` / `useNavigate`.
 *
 * Critical: when you pass `to="/path?foo=bar"` to a strict-typed `<Link>`,
 * Router treats the entire string as a pathname literal and the `?...` is
 * NOT folded into the route's `search` deps — so `loaderDeps({ search })`
 * never sees the change and the loader doesn't re-run on client navigation
 * (only F5 works, since SSR re-parses the URL fresh).
 */
export const rebaseToSearch = (
  loaderHref: string | undefined,
  basePath: string | undefined,
): { to: string; search: Record<string, string> } | undefined => {
  const rebased = rebaseSearch(loaderHref, basePath);
  if (!rebased) return undefined;
  const url = new URL(rebased, "http://localhost");
  return {
    to: url.pathname,
    search: Object.fromEntries(url.searchParams),
  };
};
