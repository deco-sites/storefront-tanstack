import { createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { DecoRootLayout } from "@decocms/tanstack";
import OneDollarStats from "@decocms/apps-website/components/OneDollarStats";
import { CART_QUERY_KEY, getCartServerFn } from "../platform/cart";
import { getUserServerFn, USER_QUERY_KEY } from "../platform/user";
import MinicartDrawer from "../components/minicart/MinicartDrawer";
// @ts-ignore Vite ?url import
import appCss from "../styles/app.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ context }) => {
    // Cart and user are per-buyer: never resolve them during SSR. Cacheable
    // pages are rendered without the buyer's cookies (the worker strips them so
    // the edge-cached HTML can't carry anyone's data), so an SSR prefetch would
    // dehydrate an empty cart/anonymous user and the client would trust it.
    // In the browser the hooks fetch them for real.
    if (typeof window === "undefined") return;
    const tasks: Promise<unknown>[] = [];
    if (!context.queryClient.getQueryData(CART_QUERY_KEY)) {
      tasks.push(
        getCartServerFn()
          .then((cart) => context.queryClient.setQueryData(CART_QUERY_KEY, cart))
          .catch(() => {}),
      );
    }
    if (!context.queryClient.getQueryData(USER_QUERY_KEY)) {
      tasks.push(
        getUserServerFn()
          .then((user) => context.queryClient.setQueryData(USER_QUERY_KEY, user))
          .catch(() => {}),
      );
    }
    await Promise.all(tasks);
  },
  head: ({ matches }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Storefront-tanstack" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
      ...canonicalFallback(matches),
    ],
  }),
  component: RootLayout,
});

/**
 * CMS routes only emit <link rel="canonical"> when the page's SEO block sets
 * one. Fall back to the current URL without query string (absolute when the
 * CMS loader exposes the page origin) so every page declares a canonical.
 */
function canonicalFallback(
  matches: Array<{ pathname: string; loaderData?: unknown }>,
) {
  const leaf = matches[matches.length - 1];
  if (!leaf) return [];
  const data = leaf.loaderData as
    | { seo?: { canonical?: string }; pageUrl?: string }
    | null
    | undefined;
  if (data?.seo?.canonical) return [];
  let href = leaf.pathname;
  if (data?.pageUrl) {
    try {
      const url = new URL(data.pageUrl);
      href = url.origin + url.pathname;
    } catch {}
  }
  return [{ rel: "canonical", href }];
}

function RootLayout() {
  return (
    <DecoRootLayout lang="en" siteName="storefront-tanstack">
      <OneDollarStats />
      <MinicartDrawer />
    </DecoRootLayout>
  );
}
