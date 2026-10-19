/**
 * Site setup — orchestrator that wires framework, apps, and sections.
 *
 * App-installed loaders + actions are wired via
 * `autoconfigApps(blocks, APP_REGISTRY)` — adding a new app is a one-line entry
 * in the local `APP_REGISTRY` array below (each `@decocms/apps-<vendor>` ships
 * its own `./registry` entry; the old aggregate `@decocms/apps/registry` is
 * gone in the 7.x split).
 *
 * Section-specific prop enrichment lives in `setup/section-loaders.ts`.
 * Section metadata (eager, sync, layout, cache, LoadingFallback) is declared
 * in each section file and auto-extracted by generate-sections.ts.
 */

import "./cache-config";

import {
  registerCommerceLoaders,
  applySectionConventions,
} from "@decocms/blocks/cms";
import { createSiteSetup } from "@decocms/blocks/setup";
import { createAdminSetup } from "@decocms/blocks-admin/setup";
import { autoconfigApps, type AppRegistry } from "@decocms/blocks-admin/apps";
import { createInstrumentedFetch } from "@decocms/blocks/sdk/instrumentedFetch";
import { initShopifyFromBlocks, setShopifyFetch } from "@decocms/apps-shopify";
import { SHOPIFY_REGISTRY_ENTRY } from "@decocms/apps-shopify/registry";
import * as shopifyMod from "@decocms/apps-shopify/mod";
import { blocks as generatedBlocks } from "../.deco/blocks.gen";
import { sectionMeta, syncComponents, loadingFallbacks } from "../.deco/sections.gen";
import { PreviewProviders } from "@decocms/tanstack";
// @ts-ignore Vite ?url import
import appCss from "./styles/app.css?url";

import "./setup/section-loaders";

// Per-app registry entries, assembled from each app package's own ./registry
// export — the aggregate `@decocms/apps/registry` no longer exists in the 7.x
// package split. Shopify is the only commerce app this store configures.
// SHOPIFY_REGISTRY_ENTRY.module is a dynamic `import("./mod")` that fails to
// resolve in the production (vite/workerd) build — autoconfigApps then silently
// swallows the error and skips Shopify, so its commerce loaders never register
// and PDP/shelves resolve to null (works in `vite dev`, breaks in prod). Provide
// the module statically so registration is build-safe.
//
// The PLP loader is swapped in the app's manifest (see wrappedShopifyPLP
// below): setupApps() re-registers every manifest loader on the first request
// and on decofile changes, which would clobber a one-off
// registerCommerceLoaders() override and drop sort/filters/pagination.
const SHOPIFY_PLP_KEY = "shopify/loaders/ProductListingPage";

const APP_REGISTRY: AppRegistry = [
  {
    ...SHOPIFY_REGISTRY_ENTRY,
    module: async () =>
      ({
        ...shopifyMod,
        configure: async (...args: Parameters<typeof shopifyMod.configure>) => {
          const app = await shopifyMod.configure(...args);
          if (!app) return app;
          const loaders = app.manifest.loaders as Record<string, unknown>;
          return {
            ...app,
            manifest: {
              ...app.manifest,
              loaders: {
                ...loaders,
                [SHOPIFY_PLP_KEY]: {
                  ...(loaders[SHOPIFY_PLP_KEY] as object),
                  default: (props: any) => wrappedShopifyPLP(props),
                },
              },
            },
          };
        },
      }) as never,
  },
];

// -- Framework setup (framework-generic options only) --
createSiteSetup({
  sections: import.meta.glob("./sections/**/*.tsx") as Record<string, () => Promise<any>>,
  blocks: generatedBlocks,
  productionOrigins: [
    "https://www.storefront-tanstack.com.br",
    "https://storefront-tanstack.com.br",
  ],
  initPlatform: (blocks) => initShopifyFromBlocks(blocks),
  onResolveError: (error, resolveType, context) => {
    console.error(`[CMS-DEBUG] ${context} "${resolveType}" failed:`, error);
  },
  onDanglingReference: (resolveType) => {
    console.warn(`[CMS-DEBUG] Dangling reference: ${resolveType}`);
    return null;
  },
});

// -- Admin setup (admin-only options: meta schema, render shell, preview) --
createAdminSetup({
  meta: () => import("../.deco/meta.gen.json").then((m) => m.default),
  css: appCss,
  fonts: [],
  previewWrapper: PreviewProviders,
});

// -- Shopify wiring --
setShopifyFetch(createInstrumentedFetch("shopify"));

// -- Convention-driven section registration --
applySectionConventions({
  meta: sectionMeta,
  syncComponents,
  loadingFallbacks,
  sectionGlob: import.meta.glob("./sections/**/*.tsx") as Record<string, () => Promise<any>>,
});

// -- Apps: auto-configure from decofile against the APP_REGISTRY --
// Registers commerce loaders (CMS resolve path) + invoke handlers (admin path)
// for every app the site has configured. Adding a new app = add its
// `@decocms/apps-<vendor>/registry` entry to the APP_REGISTRY array above.
await autoconfigApps(generatedBlocks, APP_REGISTRY);

// -- Commerce-loader overrides --
// Shopify's productListingPage loader reads filters/sort/pagination from a
// URL. The framework calls commerce loaders with `(props)` only — it injects
// `__pageUrl` into props, but Shopify ignores it and falls back to a hardcoded
// `https://localhost`, so server-side filtering never matches the real URL.
// We wrap the loader to forward the request URL via the second positional arg.
//
// On CSR navigations, `__pageUrl` is unreliable for the home route ("/"):
// `loadCmsPageInternal` derives it from `getRequestUrl()`, which returns the
// `_serverFn/...` URL, not the user's page URL. The check
// `realUrlPath.startsWith(basePath)` is too loose when basePath is "/".
// To work around it, the home/catch-all loaders forward the real page URL
// in the `x-deco-page-url` header so we can read it back here.
import { RequestContext } from "@decocms/blocks/sdk/requestContext";
import productListingPageLoader from "@decocms/apps-shopify/loaders/ProductListingPage";



const PAGE_URL_HEADER = "x-deco-page-url";

const resolvePageUrl = (props: any): URL | undefined => {
  // 1. Trust the explicit page-URL header if present (CSR home workaround).
  try {
    const headerUrl = RequestContext.request.headers.get(PAGE_URL_HEADER);
    if (headerUrl) return new URL(headerUrl, "http://localhost");
  } catch {
    // RequestContext may not be available in some isolated calls.
  }
  // 2. Framework-injected `__pageUrl` (correct for SSR + non-home CSR).
  if (props?.__pageUrl) return new URL(props.__pageUrl, "http://localhost");
  // 3. Last resort: the worker's request URL.
  try {
    return new URL(RequestContext.request.url);
  } catch {
    return undefined;
  }
};

async function wrappedShopifyPLP(props: any) {
  const pageUrl = resolvePageUrl(props);
  return productListingPageLoader(props, pageUrl);
}

registerCommerceLoaders({
  [SHOPIFY_PLP_KEY]: wrappedShopifyPLP,
  [`${SHOPIFY_PLP_KEY}.ts`]: wrappedShopifyPLP,
});

// -- Site-local loaders (not shipped by an app, still stubbed for Phase 6) --
// Cart is now served by TanStack Query via `platform/cart/` (server functions
// + `@decocms/apps/shopify/loaders/cart.getCart`), so no loader entry is
// needed here for minicart.
registerCommerceLoaders({
  "site/loaders/user.ts":     async () => (await import("./loaders/user")).default(),
  "site/loaders/user":        async () => (await import("./loaders/user")).default(),
  "site/loaders/wishlist.ts": async () => (await import("./loaders/wishlist")).default(),
  "site/loaders/wishlist":    async () => (await import("./loaders/wishlist")).default(),
  "site/loaders/address.ts":  async () => (await import("./loaders/address")).default(),
  "site/loaders/address":     async () => (await import("./loaders/address")).default(),
});

// -- Site-local loaders + actions on /deco/invoke --
// Exposed through the getter-based registry (`setInvokeLoaders`), NOT
// `registerInvokeHandlers`: `autoconfigApps` re-runs `setupApps()` on reinit /
// decofile change, which calls `clearInvokeHandlers()` and wipes the additive
// registry — so in production every `invoke.site.*` call 404'd ("Unknown
// handler"). The getter registry is never cleared.
import { setInvokeLoaders } from "@decocms/blocks-admin";
import { siteLoaders } from "../.deco/loaders.gen";

const SITE_INVOKE_HANDLERS: Record<string, (props: any, req: Request) => Promise<any>> = {
  ...siteLoaders,
  "site/actions/wishlist/submit.ts": async (props, req) =>
    (await import("./actions/wishlist/submit")).default(props, req),
  "site/actions/wishlist/submit": async (props, req) =>
    (await import("./actions/wishlist/submit")).default(props, req),
  "site/actions/shipping/simulate.ts": async (props, req) =>
    (await import("./actions/shipping/simulate")).default(props, req),
  "site/actions/shipping/simulate": async (props, req) =>
    (await import("./actions/shipping/simulate")).default(props, req),
  "site/actions/notifyMe/subscribe.ts": async (props) =>
    (await import("./actions/notifyMe/subscribe")).default(props),
  "site/actions/notifyMe/subscribe": async (props) =>
    (await import("./actions/notifyMe/subscribe")).default(props),
  "site/actions/newsletter/subscribe.ts": async (props, req) =>
    (await import("./actions/newsletter/subscribe")).default(props, req),
  "site/actions/newsletter/subscribe": async (props, req) =>
    (await import("./actions/newsletter/subscribe")).default(props, req),
  "site/actions/address/submit.ts": async (props, req) =>
    (await import("./actions/address/submit")).default(props, req),
  "site/actions/address/submit": async (props, req) =>
    (await import("./actions/address/submit")).default(props, req),
};

setInvokeLoaders(() => SITE_INVOKE_HANDLERS);
