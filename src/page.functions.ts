/**
 * The page loader as a server function (/next/tanstack-start-descriptors#4-expose-it-through-a-server-function):
 * a plain call while the server renders, a fetch from the browser on client-side navigation.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { openPage } from "./open-page.server";

export const loadPage = createServerFn({ method: "GET" })
  // A path on this site: `//host/x` is a protocol-relative URL that would move the page to another origin.
  .inputValidator(
    z.object({
      href: z
        .string()
        .startsWith("/")
        .refine((href) => !href.startsWith("//") && !href.startsWith("/\\"), "not a local path"),
    }),
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    const clientNavigation = new URL(request.url).pathname.startsWith("/_serverFn/");
    const page = await openPage(data.href, request, { clientNavigation });
    // While the server renders a document, block promises stay unawaited so each block streams.
    // A client-side navigation answers once every block is ready, as v7 did: the router swaps
    // pages at once, and the response carries data, not promises.
    if (!clientNavigation) return page;
    const blocks = await Promise.all(
      page.blocks.map(async (block) => ({ ...block, value: await block.value })),
    );
    return { ...page, blocks };
  });
