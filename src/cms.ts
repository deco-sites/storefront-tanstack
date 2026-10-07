/**
 * The CMS, created once at module scope (/next/content#create-the-cms), and the client every request
 * reads content with (/next/tanstack-start-descriptors#2-create-the-cms).
 *
 * With `DECO_SITE` and `DECO_SITE_TOKEN` set, it serves releases published in the hosted Deco CMS
 * without a deploy (/next/hosted#cloudflare-workers); without them it serves the content module, the
 * content of the commit this build was made from. Drafts need neither: `cms.forDraft` fetches what
 * the draft's branch changed from the Studio the pointer names (/next/hosted-drafts).
 */
import { createCMS } from "@decocms/blocks";
import { env } from "cloudflare:workers";
import blocks from "../.deco";
import content from "../.deco/blocks.gen";

// The token needs the site (createCMS throws on a token alone), and hosted releases stay off until
// both are set, as before.
const hosted = Boolean(env.DECO_SITE && env.DECO_SITE_TOKEN);
const site = hosted ? (env.DECO_SITE as string) : undefined;
const token = hosted ? (env.DECO_SITE_TOKEN as string) : undefined;

/** `k1=v1,k2=v2` with URL-encoded values, the format of `OTEL_EXPORTER_OTLP_HEADERS`. */
const otlpHeaders = (raw: string | undefined) => {
  const headers: Record<string, string> = {};
  for (const pair of raw?.split(",") ?? []) {
    const at = pair.indexOf("=");
    if (at <= 0) continue;
    try {
      headers[decodeURIComponent(pair.slice(0, at).trim())] = decodeURIComponent(
        pair.slice(at + 1).trim(),
      );
    } catch {
      // A malformed pair is skipped.
    }
  }
  return headers;
};

const otlpEndpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT as string | undefined;

const options = {
  blocks,
  site,
  token,
  // The hosted collector when the site is connected (the token sends there); otherwise the standard
  // OTEL_EXPORTER_OTLP_ENDPOINT/HEADERS, if set (/next/telemetry#choose-where-telemetry-goes). The SDK
  // reads no environment variables, so the site passes them. `vite dev` sends nothing, so local work
  // never reaches the production collector wrangler.jsonc points at.
  ...(import.meta.env.DEV
    ? { telemetry: false as const }
    : hosted || !otlpEndpoint
      ? {}
      : {
          telemetry: {
            endpoint: otlpEndpoint,
            headers: otlpHeaders(env.OTEL_EXPORTER_OTLP_HEADERS as string | undefined),
          },
        }),
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

/**
 * The client for this request: the draft a `?__draft=` link or the draft cookie points at, or the
 * release. On a host outside the `CMS` block's preview hosts the draft is ignored and the request
 * gets the release (/next/releases-and-drafts#allow-previews-per-host).
 */
export const client = async (request: Request) => {
  const pointer = await cms.draftPointer(request);
  return pointer ? cms.forDraft(pointer) : cms.forRelease();
};
