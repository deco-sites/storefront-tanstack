import { createFileRoute } from "@tanstack/react-router";

/**
 * Diagnostic endpoint for outbound header behavior (@decocms/start >= 6.28.0).
 *
 * GET /test-headers fires two server-side fetches at the mock webhook below,
 * then returns their statuses as JSON. The interesting part is on the
 * Beeceptor dashboard, which shows the headers each request arrived with:
 *
 *  - /default-ua  → no UA set by us; the runtime default
 *                   `Deco/<version> (+https://deco.cx)` must appear.
 *  - /custom-ua   → explicit `storefront-custom/1.0`; must arrive untouched
 *                   (caller-set UA wins over the runtime default).
 */
const WEBHOOK_BASE = "https://test-storefront-tanstack.free.beeceptor.com";

interface ProbeResult {
  path: string;
  status?: number;
  ok?: boolean;
  error?: string;
  ms: number;
}

async function probe(path: string, init?: RequestInit): Promise<ProbeResult> {
  const started = Date.now();
  try {
    const res = await fetch(`${WEBHOOK_BASE}${path}`, init);
    return { path, status: res.status, ok: res.ok, ms: Date.now() - started };
  } catch (err) {
    return { path, error: String(err), ms: Date.now() - started };
  }
}

export const Route = createFileRoute("/test-headers")({
  server: {
    handlers: {
      GET: async () => {
        const results = [
          await probe("/default-ua"),
          await probe("/custom-ua", {
            headers: { "user-agent": "storefront-custom/1.0" },
          }),
        ];
        const body = {
          webhook: WEBHOOK_BASE,
          results,
          hint: "Open the Beeceptor dashboard to inspect the User-Agent each request arrived with.",
        };
        return new Response(JSON.stringify(body, null, 2), {
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
