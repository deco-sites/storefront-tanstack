import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createDecoRouter } from "@decocms/tanstack/router";
import { routeTree } from "./routeTree.gen";
import "./setup";
import { ImageUrlProvider } from "@decocms/tanstack/react";
import { imageUrl } from "./imageUrl";

export function getRouter() {
  // One QueryClient per router: the server creates a router per request, so a visitor's data never
  // reaches another visitor's render. The browser creates one router, so it keeps one client.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  });
  return createDecoRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}><ImageUrlProvider value={imageUrl}>{children}</ImageUrlProvider></QueryClientProvider>
    ),
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
