/** Site-wide settings the root layout reads: the `analytics` section of the `CMS` block (/next/analytics). */
import { createServerFn } from "@tanstack/react-start";
import { cms } from "./cms";

/** From the live release: the settings change with a publish, not per navigation. */
export const loadLayout = createServerFn({ method: "GET" }).handler(async () => {
  const { analytics } = await cms.settings();
  return { analytics };
});
