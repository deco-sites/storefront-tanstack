import { createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { CART_QUERY_KEY, getCartServerFn } from "../platform/cart";
import { getUserServerFn, USER_QUERY_KEY } from "../platform/user";
import MinicartDrawer from "../components/minicart/MinicartDrawer";
import { loadLayout } from "../layout.functions";
import { Analytics } from "../runtime/Analytics";
import { RootDocument } from "../runtime/RootDocument";
// @ts-ignore Vite ?url import
import appCss from "../styles/app.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ context }) => {
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
  // Site-wide settings change with a release, not per navigation.
  loader: () => loadLayout(),
  staleTime: Number.POSITIVE_INFINITY,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Storefront-tanstack" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  component: RootLayout,
});

function RootLayout() {
  const { analytics } = Route.useLoaderData();
  return (
    <RootDocument>
      <Analytics {...analytics} />
      <MinicartDrawer />
    </RootDocument>
  );
}
