/**
 * The page a request renders, for the blocks that read it. A block function gets only its saved
 * inputs (/next/blocks#reading-the-request); v7 handed its loaders the page's URL (the product
 * listing reads filters, sort and paging from it) and the route's params (the product page's
 * `:slug`, through website/functions/requestToParam.ts). The page's server function
 * (src/open-page.server.ts) records them for its request before it resolves a block.
 *
 * On a client-side navigation the request is the server function's (/_serverFn/…), so the URL
 * recorded is the page's, rebuilt from the path the router asked for.
 */
import { getRequest } from "@tanstack/react-start/server";

export interface PageContext {
  /** The page's own URL, with its query string. */
  url: URL;
  /** The params matchRoute read from the page's path template, e.g. `{ slug }` for `/products/:slug`. */
  params: Record<string, string>;
}

const pages = new WeakMap<Request, PageContext>();

export function setPageContext(request: Request, context: PageContext): void {
  pages.set(request, context);
}

/** The page the current request renders, or undefined outside a page's server function. */
export function pageContext(): PageContext | undefined {
  return pages.get(getRequest());
}
