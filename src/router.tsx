import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import {
  decoParseSearch,
  decoStringifySearch,
} from "@decocms/start/sdk/router";
import { routeTree } from "./routeTree.gen";
import "./setup";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } },
});

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 60_000,
    defaultPreloadGcTime: 5 * 60_000,
    context: { queryClient } as any,
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    parseSearch: decoParseSearch,
    stringifySearch: decoStringifySearch,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
