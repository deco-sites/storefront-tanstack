/**
 * Page views and commerce events, sent with the built-in `analytics` block's settings
 * (/next/analytics): `AnalyticsScript` sends a page view on load and on every navigation, and the
 * site forwards each event its components dispatch on `window.DECO.events` (view_item_list,
 * add_to_cart, …) with `track`, as its platform template's job (/next/analytics#send-your-own-events).
 * It replaces v7's OneDollarStats component; the collector is the same.
 */
import { useEffect } from "react";
import type { Analytics as AnalyticsSettings } from "@decocms/blocks";
import { AnalyticsScript, track } from "@decocms/blocks/analytics";

type EventParams = Record<string, unknown>;

/** The tracker's per-field limit, as v7 truncated it. */
function truncate(value: unknown): string {
  const text =
    typeof value === "string"
      ? value
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  return text.slice(0, 990);
}

let forwarding = false;

function forwardDecoEvents() {
  if (forwarding) return;
  forwarding = true;
  window.DECO?.events?.subscribe((event) => {
    const { name, params } = (event ?? {}) as { name?: string; params?: EventParams };
    if (!name || name === "deco") return;
    const props: Record<string, string> = {};
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value != null) props[key] = truncate(value);
    }
    track(name, props);
  });
}

export function Analytics(settings: AnalyticsSettings) {
  useEffect(() => {
    if (settings.enabled !== false) forwardDecoEvents();
  }, [settings.enabled]);

  if (settings.enabled === false) return null;
  const collector = settings.collector;
  return (
    <>
      {collector && <link rel="dns-prefetch" href={collector} />}
      {collector && <link rel="preconnect" href={collector} crossOrigin="anonymous" />}
      <AnalyticsScript {...settings} />
    </>
  );
}
