/** Site-wide settings the root layout reads: the `analytics` section of the `CMS` block (/next/analytics). */
import { createServerFn } from "@tanstack/react-start";
import { cms } from "./cms";

/** Read from the production release, never a draft: a draft can't change the site's analytics. */
export const loadLayout = createServerFn({ method: "GET" }).handler(async () => {
  const { analytics } = await cms.settings();
  return { analytics };
});
