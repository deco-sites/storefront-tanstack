/**
 * What the home route and the catch-all route share: both serve CMS pages, found by URL with
 * `matchRoute` (src/open-page.server.ts). v7's route options are kept: the query string reaches the
 * loader (filters, sort, pagination), `skuId` (client-side variant selection) doesn't refetch, the
 * previous page stays up while the next one loads, and the page's cache profile sets its headers.
 */
import { defer } from "@tanstack/react-router";
import { buildHead } from "./head";
import type { OpenedPage } from "./open-page.server";
import { loadPage } from "./page.functions";
import { type PageBlock, PageView } from "./runtime/PageView";
import { type CacheProfileName, cacheHeaders } from "./server/cache-profiles";

const IGNORED_SEARCH_PARAMS = new Set(["skuId"]);

type Search = Record<string, string>;

export const pageRouteOptions = {
  // Keep every query param so filters, sort and pagination reach the loader.
  validateSearch: (search: Record<string, unknown>) => search as Search,
  loaderDeps: ({ search }: { search: Search }) => {
    const kept = Object.fromEntries(
      Object.entries(search ?? {}).filter(([k]) => !IGNORED_SEARCH_PARAMS.has(k)),
    );
    return { search: Object.keys(kept).length ? kept : undefined };
  },
  // Keep the previous page visible while the loader re-runs on filter/sort navigation; the search
  // result section swaps its own grid to a skeleton.
  pendingMs: 60_000,
  pendingMinMs: 0,
  staleTime: Number.POSITIVE_INFINITY,
};

/** A loaded page, with each block's result as a promise for <Await>. */
export type LoadedPage = Omit<OpenedPage, "blocks"> & { blocks: PageBlock[] };

/**
 * Loads the page at a path. While the server renders, block promises stay unawaited, so each block
 * streams in as it's ready. On a client-side navigation the server function answers with every
 * block ready (src/page.functions.ts), so the previous page stays up until the next one is complete.
 */
export async function loadPageAt(
  pathname: string,
  search: Search | undefined,
): Promise<LoadedPage> {
  const query = search ? `?${new URLSearchParams(search).toString()}` : "";
  const page = await loadPage({ data: { href: pathname + query } });
  const blocks = page.blocks.map((block) => ({
    ...block,
    // defer() records the result on the promise, so <Await> renders a ready block without suspending.
    value: defer(block.value instanceof Promise ? block.value : Promise.resolve(block.value)),
  }));
  if (typeof document !== "undefined") await Promise.all(blocks.map((block) => block.value));
  return { ...page, blocks };
}

export function pageHead(page: LoadedPage | undefined) {
  return buildHead(page);
}

export function pageHeaders(page: LoadedPage | undefined) {
  const profile: CacheProfileName = page?.profile ?? "listing";
  return cacheHeaders(profile);
}

export function PageContent({ page }: { page: LoadedPage }) {
  return <PageView blocks={page.blocks} device={page.device} />;
}
