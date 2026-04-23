/**
 * Section Loaders — server-side prop enrichment for CMS sections.
 *
 * Simple patterns (device, mobile) use framework mixins.
 * Complex loaders delegate to the section's own loader export.
 * Account sections use vtexAccountLoaders from @decocms/apps.
 */
import {
  registerSectionLoaders,
  withDevice,
  withMobile,
  withSearchParam,
  compose,
} from "@decocms/start/cms";

registerSectionLoaders({
  "site/sections/Newsletter/Newsletter.tsx": async (props: any, req: Request) => {
    const mod: any = await import("~/sections/Newsletter/Newsletter");
    return typeof mod.loader === "function" ? mod.loader(props, req) : props;
  },
  "site/sections/Social/InstagramPosts.tsx": async (props: any, req: Request) => {
    const mod: any = await import("~/sections/Social/InstagramPosts");
    return typeof mod.loader === "function" ? mod.loader(props, req) : props;
  },
});
