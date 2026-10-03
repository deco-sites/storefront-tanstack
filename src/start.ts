/**
 * Start's request middleware: stores the draft pointer of a `?__draft=` link in a cookie, so the
 * site editor's preview keeps showing the draft while an editor navigates (/next/hosted-drafts#tanstack-start).
 */
import { createMiddleware, createStart } from "@tanstack/react-start";
import { draftCookie } from "@decocms/blocks";

const draftCookieMiddleware = createMiddleware().server(async ({ request, next }) => {
  const result = await next();
  const cookie = draftCookie(request);
  if (cookie) result.response.headers.append("Set-Cookie", cookie);
  return result;
});

export const startInstance = createStart(() => ({ requestMiddleware: [draftCookieMiddleware] }));
