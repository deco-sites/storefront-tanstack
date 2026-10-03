/**
 * Page views and commerce events, configured by the built-in `analytics` block (/next/analytics)
 * and sent with One Dollar Stats' own tracker script, the documented alternative to
 * `AnalyticsScript` (/next/analytics#one-dollar-stats: "use their tracker script on your site").
 * The block's `collector` and `enabled` drive it, so editors keep control of both.
 *
 * This is the same tracker, collector and call sequence v7's OneDollarStats component used:
 * auto-collect is off, the site sends the first page view and one per navigation itself, and it
 * forwards each event its components dispatch on `window.DECO.events` (view_item_list,
 * add_to_cart, …) as its platform template's job.
 */
import { useEffect } from "react";
import type { Analytics as AnalyticsSettings } from "@decocms/blocks";

declare global {
  interface Window {
    stonks?: {
      view?: (params?: Record<string, string | boolean | number>) => void;
      event?: (name: string, params?: Record<string, string | boolean | number>) => void;
    };
  }
}

/** One Dollar Stats' tracker build for Deco sites (exposes `window.stonks`). */
const TRACKER_SCRIPT = "https://s.lilstts.com/deco.js";
/** One Dollar Stats' collector, used when the block leaves `collector` out. */
const DEFAULT_COLLECTOR = "https://d.lilstts.com/events";

/** The tracker's per-field limit. */
function truncate(value: unknown): string {
  const text =
    typeof value === "string"
      ? value
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  return text.slice(0, 990);
}

/** Polls for a global for up to ~10 s, then calls `cb` once with it. */
function whenReady<T>(check: () => T | undefined, cb: (value: T) => void): void {
  const initial = check();
  if (initial !== undefined) return cb(initial);
  let attempts = 0;
  const iv = setInterval(() => {
    attempts++;
    const value = check();
    if (value !== undefined) {
      clearInterval(iv);
      cb(value);
    } else if (attempts >= 200) {
      clearInterval(iv);
    }
  }, 50);
}

let initialized = false;

function init(): void {
  if (initialized) return;
  initialized = true;

  whenReady(
    () =>
      typeof window.stonks?.view === "function" ? window.stonks.view.bind(window.stonks) : undefined,
    (view) => {
      view({});
      const original = history.pushState;
      history.pushState = function (this: History, ...args: Parameters<History["pushState"]>) {
        original.apply(this, args);
        try {
          view({});
        } catch (err) {
          console.error("[analytics] pushState handler", err);
        }
      } as History["pushState"];
      addEventListener("popstate", () => view({}));
    },
  );

  whenReady(
    () =>
      typeof window.DECO?.events?.subscribe === "function"
        ? window.DECO.events.subscribe.bind(window.DECO.events)
        : undefined,
    (subscribe) => {
      subscribe((event) => {
        const { name, params } = (event ?? {}) as {
          name?: string;
          params?: Record<string, unknown>;
        };
        if (!name || name === "deco") return;
        if (typeof window.stonks?.event !== "function") return;
        const props: Record<string, string> = {};
        for (const [key, value] of Object.entries(params ?? {})) {
          if (value != null) props[key] = truncate(value);
        }
        window.stonks.event(name, props);
      });
    },
  );
}

function AnalyticsClient() {
  useEffect(() => init(), []);
  return null;
}

export function Analytics(settings: AnalyticsSettings) {
  if (settings.enabled === false) return null;
  const collector = settings.collector ?? DEFAULT_COLLECTOR;
  return (
    <>
      <link rel="dns-prefetch" href={collector} />
      <link rel="preconnect" href={collector} crossOrigin="anonymous" />
      <script
        id="onedollarstats-tracker"
        data-autocollect="false"
        data-hash-routing="true"
        data-url={collector}
        src={TRACKER_SCRIPT}
        defer
      />
      <AnalyticsClient />
    </>
  );
}
