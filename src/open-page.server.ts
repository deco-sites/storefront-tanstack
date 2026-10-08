/**
 * Finds the page for a URL and starts every block on it (/next/tanstack-start-descriptors#3-match-the-url-to-a-page).
 * Each block resolves on its own, so its promise streams to the browser when it's ready, and the
 * page's SEO is awaited only after every block has started.
 */
import { notFound, redirect } from "@tanstack/react-router";
import { type Block, matchRoute, type Redirect } from "@decocms/blocks";
import { client } from "./cms";
import type { BlockDescriptor, PageSeo, StoredPage } from "./model";
import { withPage } from "./request-state.server";
import { detectDevice } from "./sdk/device";
import { type CacheProfileName, detectCacheProfile } from "./server/cache-profiles";

/** The section type saved, read before the block resolves, when the block is a section. */
function componentOf(stored: unknown): string | undefined {
  if (!stored || typeof stored !== "object") return undefined;
  return (stored as Block).__resolveType;
}

/** Opens the page at `href` for `request`. */
export async function openPage(href: string, request: Request) {
  const url = new URL(href, request.url);
  // Blocks read the page URL (pageState().url) and its request: it must stay on this site's origin.
  if (url.origin !== new URL(request.url).origin) throw notFound();
  const c = await client(request);
  const [pages, pagesError] = await c.list<StoredPage>("page");
  if (pagesError) throw pagesError;
  const [redirects, redirectsError] = await c.list<Redirect>("redirect");
  if (redirectsError) throw redirectsError;

  const match = matchRoute(url, { routes: pages, redirects });
  if (match.kind === "not-found") throw notFound();
  if (match.kind === "redirect") throw redirect({ href: match.location, statusCode: match.status });

  const page = match.entry;
  const device = detectDevice(request.headers.get("user-agent") ?? "");
  const state = {
    url,
    request: new Request(url, { headers: request.headers }),
    params: match.params,
    device,
  };

  return withPage(state, async () => {
    // Variants of the whole list are one multivariate block: it resolves to the chosen list and streams as one.
    const sections = Array.isArray(page.sections) ? page.sections : [page.sections];
    // Reading the saved blocks runs nothing: it only expands saved-block references.
    const stored = await Promise.all(sections.map((block) => c.resolve(block, { run: false })));
    const blocks = sections.map((block, index) => ({
      // v7's keys, so a section that stays on the page keeps its state across client-side
      // navigations exactly as before.
      key: `${componentOf(stored[index]?.[0]) ?? "block"}-${index}`,
      value: c
        .resolve<BlockDescriptor | BlockDescriptor[] | undefined>(block)
        .then(([value, blockError]) => {
          if (blockError) console.error(blockError);
          return { value: value ?? undefined, failed: blockError !== null };
        }),
    }));

    // Every block has started before SEO is awaited.
    const [seo, seoError] = await c.resolve<PageSeo | undefined>(page.seo);
    if (seoError) throw seoError;

    const profile: CacheProfileName =
      url.pathname === "/" ? "static" : detectCacheProfile(url.pathname);
    return { name: page.name, seo: seo ?? undefined, device, profile, blocks };
  });
}

export type OpenedPage = Awaited<ReturnType<typeof openPage>>;
