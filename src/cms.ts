/**
 * The CMS, created once at module scope (/next/content#create-the-cms), and the client every request
 * reads content with (/next/tanstack-start-descriptors#2-create-the-cms).
 *
 * With `DECO_SITE` and `DECO_SITE_TOKEN` set, it serves releases published in the hosted Deco CMS
 * without a deploy and loads the drafts the site editor previews (/next/hosted#cloudflare-workers);
 * without them it serves the content module, the content of the commit this build was made from.
 */
import { createCMS, draftPointer } from "@decocms/blocks";
import { env } from "cloudflare:workers";
import blocks from "../.deco";
import content from "../.deco/blocks.gen";

const site = env.DECO_SITE as string | undefined;
const token = env.DECO_SITE_TOKEN as string | undefined;

export const cms = createCMS({
  blocks,
  content,
  site,
  token,
  // The hosted collector when the site is connected; otherwise the standard OTEL_EXPORTER_OTLP_*
  // variables, if set (/next/telemetry#choose-where-telemetry-goes).
  ...(site && token ? { telemetry: { site, token } } : {}),
});

/** The client for this request: the draft a `?__draft=` link or the draft cookie points at, or the release. */
export const client = (request: Request) => {
  const pointer = draftPointer(request);
  return pointer ? cms.forDraft(pointer) : cms.forRelease();
};
