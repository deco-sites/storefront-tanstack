// Server-function calls carry the page's CDN segment token, so the CDN can cache navigation data
// (@decocms/tanstack/start). The worker decides drafts, so there is no draft middleware here.
import { decoServerFnFetch } from "@decocms/tanstack/start";
import { createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => ({ serverFns: { fetch: decoServerFnFetch } }));
