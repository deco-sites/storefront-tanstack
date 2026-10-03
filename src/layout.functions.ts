/** Site-wide settings the root layout reads from content: the `Analytics` saved block (/next/analytics). */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { Analytics } from "@decocms/blocks";
import { client } from "./cms";

export const loadLayout = createServerFn({ method: "GET" }).handler(async () => {
  const [analytics, error] = await client(getRequest()).resolve<Analytics>("Analytics");
  if (error) console.error(error);
  return { analytics: analytics ?? { enabled: false } };
});
