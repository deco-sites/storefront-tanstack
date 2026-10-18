import { createFileRoute } from "@tanstack/react-router";
import { loadPageAt, PageContent, pageHead, pageHeaders, pageRouteOptions } from "../page-route";

export const Route = createFileRoute("/$")({
  ...pageRouteOptions,
  gcTime: 300_000,
  loader: ({ params, deps }) => loadPageAt(`/${params._splat ?? ""}`, deps.search),
  head: ({ loaderData }) => pageHead(loaderData),
  headers: ({ loaderData }) => pageHeaders(loaderData),
  component: CmsPage,
  notFoundComponent: NotFoundPage,
});

function CmsPage() {
  return <PageContent page={Route.useLoaderData()} />;
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-base-content/20 mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
        <p className="text-base-content/60 mb-6">No CMS page block matches this URL.</p>
        <a href="/" className="btn btn-primary">
          Go Home
        </a>
      </div>
    </div>
  );
}
