/**
 * The CMS, created once at module scope (/next/content#create-the-cms), and the content client each
 * request reads: the draft the worker accepted, or the release.
 *
 * Content is hosted: the site's latest release on the delivery CDN, fetched at runtime and followed
 * as Studio publishes (/next/hosted). It is never bundled: `.deco/blocks` in git is only what was
 * published (see README, "Content"). The site is the `DECO_SITE` var (wrangler.jsonc), the token the
 * `DECO_SITE_TOKEN` secret, which only sends telemetry to the hosted collector; the SDK reads no
 * environment variable, so the site passes both.
 */
import { createCMS } from "@decocms/blocks";
import { contentClient } from "@decocms/tanstack/server";
import { env } from "cloudflare:workers";
import blocks from "../.deco";

const vars = env as Record<string, string | undefined>;
const site = vars.DECO_SITE;
if (!site) throw new Error("DECO_SITE is not set: the site reads its content from the delivery CDN");
const token = vars.DECO_SITE_TOKEN || undefined;
const versionId = (env as unknown as { CF_VERSION_METADATA?: { id?: string } }).CF_VERSION_METADATA?.id;

export const cms = createCMS({
  blocks,
  site,
  token,
  // v7 exported to the OTLP collector in wrangler.jsonc with DECO_OTEL_AUTH_TOKEN; without the
  // site token, the same collector when that secret is set, and nothing otherwise (local runs).
  ...(token
    ? {}
    : vars.DECO_OTEL_AUTH_TOKEN
      ? {
          telemetry: {
            endpoint: "https://otel-ingest.infra.deco.cx",
            // v7's secret is the Authorization header's whole value ("Bearer …").
            headers: { Authorization: vars.DECO_OTEL_AUTH_TOKEN },
            resource: {
              "service.name": vars.DECO_SITE_NAME ?? "storefront-tanstack",
              "deployment.environment.name": vars.DECO_ENV_NAME ?? "production",
              // wrangler.jsonc's version_metadata binding, as v7's instrumentWorker read it.
              ...(versionId ? { "service.version": versionId } : {}),
            },
          },
        }
      : { telemetry: false as const }),
});

/** The client for this request: the draft createDecoWorker accepted, or the release. */
export const client = async (request: Request) => contentClient(cms, request);
