import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteConfig, DecoPageRenderer } from "@decocms/tanstack";
import { deferredSectionLoader } from "@decocms/tanstack/sdk/deferredSectionLoader";
import NotFoundPage from "~/components/ui/NotFoundPage";

const routeConfig = cmsRouteConfig({
  siteName: "Storefront-tanstack",
  defaultTitle: "Storefront-tanstack",
  ignoreSearchParams: ["skuId"],
  // Keep the previous route UI visible while the loader re-runs on filter/sort
  // navigation. Without this, framework defaults (pendingMs=200) flash the
  // pending UI. The SearchResult section refetches its own data via TanStack
  // Query (see useProductListingPage), so only the products grid swaps.
  pendingMs: 60_000,
  pendingMinMs: 0,
});

export const Route = createFileRoute("/$")({
  ...routeConfig,
  component: CmsPage,
  notFoundComponent: NotFoundPage,
});

// Deferred sections are cached client-side by `pagePath`, which has no query
// string — so after a sort/filter navigation the listing came back from that
// cache unchanged. Key the renderer by path + search, and strip the search
// again before asking the server (it matches the CMS page by path alone).
const searchOf = (pageUrl?: string) => {
  try {
    return pageUrl ? new URL(pageUrl, "http://localhost").search : "";
  } catch {
    return "";
  }
};

const loadDeferredSection: typeof deferredSectionLoader = (args) =>
  deferredSectionLoader({ ...args, pagePath: args.pagePath.split("?")[0] || "/" });

function CmsPage() {
  const data = Route.useLoaderData() as Record<string, any> | null;
  if (!data) return <NotFoundPage />;

  return (
    <DecoPageRenderer
      sections={data.resolvedSections ?? []}
      deferredSections={data.deferredSections ?? []}
      deferredPromises={data.deferredPromises}
      pagePath={`${data.pagePath ?? "/"}${searchOf(data.pageUrl)}`}
      pageUrl={data.pageUrl}
      loadDeferredSectionFn={loadDeferredSection}
    />
  );
}
