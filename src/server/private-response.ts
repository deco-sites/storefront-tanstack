/**
 * Marks a server function's HTTP response as per-visitor: `Cache-Control: private, no-store`, which
 * the edge cache (src/server/edge-cache.ts) never stores. The worker already treats every GET server
 * function without a page path as private; this says so on the response too, so the rule survives a
 * change to the wrapper and tells browsers and any other cache the same.
 *
 * It only touches the response when the browser called the function over HTTP: while the server
 * renders a document the function is a plain call, and the header would land on the page itself.
 */
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";

/** True when the browser called the server function over HTTP, false while a document renders. */
export function isServerFnCall(): boolean {
  return new URL(getRequest().url).pathname.startsWith("/_serverFn/");
}

export function markPrivate(): void {
  if (!isServerFnCall()) return;
  setResponseHeader("Cache-Control", "private, no-store");
}
