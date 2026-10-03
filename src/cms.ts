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

const options = {
  blocks,
  site,
  token,
  // The hosted collector when the site is connected; otherwise the standard OTEL_EXPORTER_OTLP_*
  // variables, if set (/next/telemetry#choose-where-telemetry-goes). `vite dev` sends nothing, so
  // local work never reaches the production collector wrangler.jsonc points at.
  ...(import.meta.env.DEV
    ? { telemetry: false as const }
    : site && token
      ? { telemetry: { site, token } }
      : {}),
};

export const cms = createCMS({ ...options, content });

// In `vite dev`, `deco serve` (the site editor's local server) rewrites the content module on every
// save. The new content goes into the same CMS (createCMS adopts it for the same content root), so
// this module stays as it is: re-running it made the first request after each save fail with
// "client is not a function" from a server function still holding the old module.
if (import.meta.hot) {
  import.meta.hot.accept("../.deco/blocks.gen", (next) => {
    if (next) createCMS({ ...options, content: next.default });
  });
}

/** The client for this request: the draft a `?__draft=` link or the draft cookie points at, or the release. */
export const client = (request: Request) => {
  const pointer = draftPointer(request);
  return pointer ? cms.forDraft(pointer) : cms.forRelease();
};
