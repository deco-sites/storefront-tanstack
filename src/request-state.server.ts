/**
 * Request state for block functions. A block function gets only its saved inputs (/next/blocks#reading-the-request),
 * so the few that depend on the page being rendered (the product listing loader reads filters from the
 * URL, the product page reads the `:slug` route param, sections rebase links on the page URL) read it
 * from here. The page loader (src/open-page.server.ts) runs every block of a page inside `withPage`.
 *
 * On a client-side navigation the incoming request is the server function's, not the page's, so the
 * page URL is rebuilt from the href the router asked for.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import type { Device } from "./sdk/device";

export interface PageState {
  /** The page's own URL, with its query string. */
  url: URL;
  /** A request for the page URL that carries the incoming request's headers (cookies, user agent). */
  request: Request;
  /** The params `matchRoute` extracted from the page's path template, e.g. `{ slug }` for `/products/:slug`. */
  params: Record<string, string>;
  device: Device;
}

const storage = new AsyncLocalStorage<PageState>();

export function withPage<T>(state: PageState, fn: () => T): T {
  return storage.run(state, fn);
}

/** The page being rendered. Throws outside a page render, where no block function should run. */
export function pageState(): PageState {
  const state = storage.getStore();
  if (!state) throw new Error("pageState() called outside a page render");
  return state;
}
