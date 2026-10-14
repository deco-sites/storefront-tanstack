import { createFileRoute } from "@tanstack/react-router";
import { loadPageAt, PageContent, pageHead, pageHeaders, pageRouteOptions } from "../page-route";

export const Route = createFileRoute("/")({
  ...pageRouteOptions,
  gcTime: 1_800_000,
  loader: ({ deps }) => loadPageAt("/", deps.search),
  head: ({ loaderData }) => pageHead(loaderData),
  headers: ({ loaderData }) => pageHeaders(loaderData),
  component: HomePage,
});

function HomePage() {
  return <PageContent page={Route.useLoaderData()} />;
}
