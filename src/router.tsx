import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, type SearchParser, type SearchSerializer } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } },
});

/**
 * Plain URLSearchParams search params instead of TanStack's JSON format, so commerce filter URLs
 * such as `?filter.size=M&filter.size=L` round-trip unchanged (v7's createDecoRouter did the same).
 */
const parseSearch: SearchParser = (searchStr) => {
  const str = searchStr.startsWith("?") ? searchStr.slice(1) : searchStr;
  if (!str) return {};
  const params = new URLSearchParams(str);
  const result: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length === 1 ? values[0] : values;
  }
  return result;
};

const stringifySearch: SearchSerializer = (search) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) for (const v of value) params.append(key, String(v));
    else params.append(key, String(value));
  }
  const str = params.toString();
  return str ? `?${str}` : "";
};

export function getRouter() {
  return createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    parseSearch,
    stringifySearch,
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
