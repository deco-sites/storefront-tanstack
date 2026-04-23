import { createFileRoute } from "@tanstack/react-router";
import { cmsHomeRouteConfig, deferredSectionLoader } from "@decocms/start/routes";
import { DecoPageRenderer } from "@decocms/start/hooks";

export const Route = createFileRoute("/")({
  ...cmsHomeRouteConfig({
    defaultTitle: "Storefront-tanstack",
    siteName: "Storefront-tanstack",
  }),
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData() as Record<string, any> | null;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Storefront-tanstack</h1>
          <p className="text-sm text-base-content/40 mt-2">No CMS page found for /</p>
        </div>
      </div>
    );
  }

  return (
    <DecoPageRenderer
      sections={data.resolvedSections ?? []}
      deferredSections={data.deferredSections ?? []}
      deferredPromises={data.deferredPromises}
      pagePath={data.pagePath}
      pageUrl={data.pageUrl}
      loadDeferredSectionFn={deferredSectionLoader}
    />
  );
}
