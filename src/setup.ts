/**
 * Site setup — orchestrator that wires framework, apps, and sections.
 *
 * App-installed loaders + actions (Shopify, VTEX, Resend, …) are wired via
 * `autoconfigApps(blocks, APP_REGISTRY)` — adding a new app is a one-line
 * entry in `@decocms/apps/registry.ts`, no change needed here.
 *
 * Section-specific prop enrichment lives in `setup/section-loaders.ts`.
 * Section metadata (eager, sync, layout, cache, LoadingFallback) is declared
 * in each section file and auto-extracted by generate-sections.ts.
 */

import "./cache-config";

import {
  registerCommerceLoaders,
  applySectionConventions,
} from "@decocms/start/cms";
import { createSiteSetup } from "@decocms/start/setup";
import { autoconfigApps } from "@decocms/start/apps";
import { createInstrumentedFetch } from "@decocms/start/sdk/instrumentedFetch";
import { initShopifyFromBlocks, setShopifyFetch } from "@decocms/apps/shopify";
import { APP_REGISTRY } from "@decocms/apps/registry";
import { blocks as generatedBlocks } from "./server/cms/blocks.gen";
import { sectionMeta, syncComponents, loadingFallbacks } from "./server/cms/sections.gen";
import { PreviewProviders } from "@decocms/start/hooks";
// @ts-ignore Vite ?url import
import appCss from "./styles/app.css?url";

import "./setup/section-loaders";

// -- Framework setup --
createSiteSetup({
  sections: import.meta.glob("./sections/**/*.tsx") as Record<string, () => Promise<any>>,
  blocks: generatedBlocks,
  meta: () => import("./server/admin/meta.gen.json").then((m) => m.default),
  css: appCss,
  fonts: [],
  productionOrigins: [
    "https://www.storefront-tanstack.com.br",
    "https://storefront-tanstack.com.br",
  ],
  previewWrapper: PreviewProviders,
  initPlatform: (blocks) => initShopifyFromBlocks(blocks),
  onResolveError: (error, resolveType, context) => {
    console.error(`[CMS-DEBUG] ${context} "${resolveType}" failed:`, error);
  },
  onDanglingReference: (resolveType) => {
    console.warn(`[CMS-DEBUG] Dangling reference: ${resolveType}`);
    return null;
  },
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

// -- Apps: auto-configure from decofile against the @decocms/apps registry --
// Registers commerce loaders (CMS resolve path) + invoke handlers (admin path)
// for every app the site has configured. Adding a new app = add an entry in
// @decocms/apps/registry.ts, no change needed here.
await autoconfigApps(generatedBlocks, APP_REGISTRY);

// -- Site-local loaders (not shipped by an app, still stubbed for Phase 6) --
// Cart is now served by TanStack Query via `platform/cart/` (server functions
// + `@decocms/apps/shopify/loaders/cart.getCart`), so no loader entry is
// needed here for minicart.
registerCommerceLoaders({
  "site/loaders/user.ts":     async () => (await import("./loaders/user")).default(),
  "site/loaders/user":        async () => (await import("./loaders/user")).default(),
  "site/loaders/wishlist.ts": async () => (await import("./loaders/wishlist")).default(),
  "site/loaders/wishlist":    async () => (await import("./loaders/wishlist")).default(),
});
