/**
 * Section Loaders — server-side prop enrichment for CMS sections.
 *
 * Simple patterns (device, mobile) use framework mixins.
 * Complex loaders delegate to the section's own loader export.
 */
import { withDevice, withMobile, withSearchParam, compose } from "@decocms/compat-v7/sections";
import type { RunSectionLoadersOptions } from "@decocms/compat-v7/sections";

// v7 cached Instagram's loader in memory (createCachedLoader, the "static" profile), which v8
// doesn't have (/next/caching#upstream-data: an upstream cache is the site's own fetch). No saved
// page renders InstagramPosts today, so its loader runs uncached; give its fetch a cache before
// putting the section on a page.
const instagramLoader = async (props: any) => {
  const mod: any = await import("~/sections/Social/InstagramPosts");
  return typeof mod.loader === "function" ? mod.loader(props) : props;
};

export const sectionLoaders: RunSectionLoadersOptions["loaders"] = {
  "site/sections/Newsletter/Newsletter.tsx": async (props: any, req: Request) => {
    const mod: any = await import("~/sections/Newsletter/Newsletter");
    return typeof mod.loader === "function" ? mod.loader(props, req) : props;
  },
  "site/sections/Social/InstagramPosts.tsx": instagramLoader,
  // SearchResult needs the request URL to rebase filter/sort/pagination links
  // (commerce loaders return URLs with the wrong origin/pathname).
  "site/sections/Product/SearchResult.tsx": async (props: any, req: Request) => {
    const mod: any = await import("~/sections/Product/SearchResult");
    return typeof mod.loader === "function" ? mod.loader(props, req) : props;
  },
};
