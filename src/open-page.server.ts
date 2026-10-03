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

/** v7's Lazy wrapper, under its v7 name (.deco/index.ts). */
const LAZY_TYPES = new Set(["website/sections/Rendering/Lazy.tsx"]);

/** What the page knows about a block before it resolves: enough to show the right placeholder. */
export interface BlockHint {
  /** The section type saved, when the block is a section. */
  component?: string;
  /** Saved inside v7's Lazy wrapper. */
  deferred: boolean;
}

function hintOf(stored: unknown): BlockHint {
  if (!stored || typeof stored !== "object") return { deferred: false };
  const block = stored as Block;
  if (LAZY_TYPES.has(block.__resolveType)) {
    const inner = block.section as Block | undefined;
    return { component: inner?.__resolveType, deferred: true };
  }
  return { component: block.__resolveType, deferred: false };
}

/**
 * Opens the page at `href` for `request`. `clientNavigation` is true when the browser asked for it
 * through the server function rather than as a document.
 */
export async function openPage(href: string, request: Request, { clientNavigation = false } = {}) {
  const url = new URL(href, request.url);
  // Blocks read the page URL (pageState().url) and its request: it must stay on this site's origin.
  if (url.origin !== new URL(request.url).origin) throw notFound();
  const c = client(request);
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
    const blocks = sections.map((block, index) => {
      const hint = hintOf(stored[index]?.[0]);
      return {
        // v7's keys, so sections keep or reset their state across client-side navigations exactly
        // as before: a section that stays on the page keeps its state, and one that was saved inside
        // the Lazy wrapper remounts on the first navigation away from the server-rendered page.
        key:
          hint.deferred && !clientNavigation
            ? `deferred-${url.pathname}-${hint.component}-${index}`
            : `${hint.component ?? "block"}-${index}`,
        hint,
        value: c
          .resolve<BlockDescriptor | BlockDescriptor[] | undefined>(block)
          .then(([value, blockError]) => {
            if (blockError) console.error(blockError);
            return { value: value ?? undefined, failed: blockError !== null };
          }),
      };
    });

    // Every block has started before SEO is awaited.
    const [seo, seoError] = await c.resolve<PageSeo | undefined>(page.seo);
    if (seoError) throw seoError;

    const profile: CacheProfileName =
      url.pathname === "/" ? "static" : detectCacheProfile(url.pathname);
    return { name: page.name, seo: seo ?? undefined, device, profile, blocks };
  });
}

export type OpenedPage = Awaited<ReturnType<typeof openPage>>;
