import { createFileRoute } from "@tanstack/react-router";

/**
 * Client IP / geo forwarding probe.
 *
 * Answers, in one request, the question a customer asks when their backend
 * does not see the real visitor IP: does it leave *us* correctly?
 *
 *   GET /ip-probe                      -> what this Worker received
 *   GET /ip-probe?url=<echo endpoint>  -> also forwards outbound and reports
 *                                         exactly what was sent
 *   &mode=fixed | legacy | both        -> which forwarding strategy to send
 *                                         (default: both, sent one after the
 *                                         other so an echo service shows the
 *                                         difference side by side)
 *
 * `legacy` reproduces what the Magento proxy does today: strip every `cf-*`
 * header and overwrite x-forwarded-for with an origin URL. `fixed` is the
 * strategy from the client-IP fix: rebuild x-forwarded-for from the one header
 * Cloudflare guarantees, drop the spoofable ones, keep ASCII-safe geo.
 *
 * Trust model, measured against production rather than assumed:
 *   - cf-connecting-ip  authoritative. CF overwrites it and 403s a forgery.
 *   - x-forwarded-for   NOT authoritative. CF *appends*, so entry [0] is
 *                       attacker controlled. Only counting from the right means
 *                       anything.
 *   - true-client-ip    NOT authoritative. Passes through unvalidated.
 */

/** Never echo these back, whatever the mode. */
const SECRET_HEADERS = [
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-deco-origin-auth",
];

/** Client-settable IP headers Cloudflare does not validate. */
const SPOOFABLE_IP_HEADERS = ["true-client-ip", "x-real-ip", "x-client-ip", "x-cluster-client-ip"];

/**
 * Free-text CF geo headers. Accented city/region values are invalid
 * ISO-8859-1 header content and break strict parsers (PHP among them) — the
 * original reason the proxy stripped every cf-* header.
 */
const NON_ASCII_CF_HEADERS = ["cf-ipcity", "cf-region"];

const redact = (headers: Headers): Record<string, string> => {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = SECRET_HEADERS.includes(key.toLowerCase())
      ? `<redacted:${value.length} chars>`
      : value;
  });
  return out;
};

/**
 * Echo services this route may call. Without an allowlist, ?url= turns a public
 * endpoint into an open proxy: anyone could drive server-side requests from our
 * Worker to a destination of their choosing.
 */
const ALLOWED_ECHO_HOSTS = [
  "beeceptor.com",
  "webhook.site",
  "requestbin.com",
  "pipedream.net",
  "httpbin.org",
  "postman-echo.com",
];

/** null when the target is missing, malformed, or not an allowed echo host. */
const resolveTarget = (raw: string | null): URL | null => {
  if (!raw) return null;
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return null;
  }
  if (target.protocol !== "https:") return null;
  const host = target.hostname.toLowerCase();
  const allowed = ALLOWED_ECHO_HOSTS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
  return allowed ? target : null;
};

const chain = (value: string | null): string[] =>
  value
    ? value
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

const isPrivate = (ip: string): boolean =>
  /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fc|fd)/i.test(ip);

/**
 * Strategy used by the Magento proxy today — reproduced to show the failure.
 *
 * Credentials are stripped even here. Reproducing the bug faithfully would
 * forward this request's cookies and the shared origin-auth token to whatever
 * ?url= points at, turning a public diagnostic endpoint into a credential
 * exfiltration primitive. The x-forwarded-for defect is what this mode exists
 * to demonstrate, and it survives the redaction intact.
 */
const buildLegacyHeaders = (request: Request, url: URL): Headers => {
  const out = new Headers(request.headers);
  out.forEach((_v, key) => {
    if (key.startsWith("cf-")) out.delete(key);
  });
  for (const h of SECRET_HEADERS) out.delete(h);
  out.delete("host");
  out.delete("content-length");
  // The actual bug: an origin URL where an IP belongs.
  out.set("x-forwarded-for", url.origin);
  return out;
};

/**
 * Rebuild the canonical Cloudflare geo headers from `request.cf`.
 *
 * Mirrors the fix under review on the Magento proxy. The header mirror cannot
 * be used as a source: Cloudflare omits the free-text ones (city, region) to a
 * Worker entirely — verified, and unaffected by the "Add visitor location
 * headers" managed transform — and delivers them double-encoded to an origin.
 * ASN and AS organization have no header form at all, and are the strongest
 * VPN / datacenter / proxy signals available.
 *
 * RFC 9110 section 5.5 limits field values to US-ASCII, so anything outside it
 * is percent-encoded rather than sent raw or stripped of accents.
 */
const applyGeoHeaders = (headers: Headers, cf?: Record<string, unknown>) => {
  if (!cf) return;
  const set = (name: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    const text = String(value);
    headers.set(name, /^[\x20-\x7E]*$/.test(text) ? text : encodeURIComponent(text));
  };
  set("cf-ipcountry", cf.country);
  set("cf-ipcity", cf.city);
  set("cf-region", cf.region);
  set("cf-region-code", cf.regionCode);
  set("cf-ipcontinent", cf.continent);
  set("cf-iplatitude", cf.latitude);
  set("cf-iplongitude", cf.longitude);
  set("cf-timezone", cf.timezone);
  set("cf-postal-code", cf.postalCode);
  set("cf-asn", cf.asn);
  set("cf-as-organization", cf.asOrganization);
};

/** Strategy from the client-IP fix. */
const buildFixedHeaders = (request: Request, url: URL): Headers => {
  const out = new Headers(request.headers);
  const clientIp = request.headers.get("cf-connecting-ip");
  const cf = (request as Request & { cf?: Record<string, unknown> }).cf;

  for (const h of SPOOFABLE_IP_HEADERS) out.delete(h);
  for (const h of NON_ASCII_CF_HEADERS) out.delete(h);
  for (const h of SECRET_HEADERS) out.delete(h);
  out.delete("host");
  out.delete("content-length");

  if (clientIp) {
    // Rebuilt, never appended: the prefix a client can inject upstream must
    // not survive this hop.
    out.set("x-forwarded-for", clientIp);
    out.set("x-real-ip", clientIp);
    out.set("forwarded", `for=${clientIp};proto=https;host=${url.host}`);
  } else {
    out.delete("x-forwarded-for");
    out.delete("forwarded");
  }
  applyGeoHeaders(out, cf);
  return out;
};

interface Sent {
  mode: string;
  headersSent: Record<string, string>;
  clientIpAsSent: string | null;
  status?: number;
  ms: number;
  responseSnippet?: string;
  error?: string;
}

const send = async (target: string, mode: string, headers: Headers): Promise<Sent> => {
  const started = Date.now();
  const headersSent = redact(headers);
  try {
    const res = await fetch(target, { headers, redirect: "manual" });
    const text = await res.text();
    return {
      mode,
      headersSent,
      clientIpAsSent: headers.get("x-forwarded-for"),
      status: res.status,
      ms: Date.now() - started,
      responseSnippet: text.slice(0, 1500),
    };
  } catch (err) {
    return {
      mode,
      headersSent,
      clientIpAsSent: headers.get("x-forwarded-for"),
      ms: Date.now() - started,
      error: String(err),
    };
  }
};

export const Route = createFileRoute("/ip-probe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const requestedTarget = url.searchParams.get("url");
        const targetUrl = resolveTarget(requestedTarget);
        const target = targetUrl?.href ?? null;
        const mode = (url.searchParams.get("mode") ?? "both").toLowerCase();

        const xff = chain(request.headers.get("x-forwarded-for"));
        const cfIp = request.headers.get("cf-connecting-ip");

        // Structured geo from the Workers runtime — no header encoding issues.
        const cf = (request as Request & { cf?: Record<string, unknown> }).cf;

        const inbound = {
          clientIp: {
            "cf-connecting-ip": cfIp,
            trustworthy: Boolean(cfIp),
            "x-forwarded-for[0]": xff[0] ?? null,
            "x-forwarded-for[last]": xff.at(-1) ?? null,
            "true-client-ip": request.headers.get("true-client-ip"),
            "x-real-ip": request.headers.get("x-real-ip"),
          },
          xffChain: xff.map((ip, i) => ({
            index: i,
            fromRight: xff.length - i,
            ip,
            private: isPrivate(ip),
            isRealClient: ip === cfIp,
          })),
          // >1 means the request crossed Cloudflare more than once, i.e. a
          // second CDN sits in front of us and cf-connecting-ip is its edge.
          cdnLoop: request.headers.get("cdn-loop"),
          cfRay: request.headers.get("cf-ray"),
          geoFromHeaders: {
            country: request.headers.get("cf-ipcountry"),
            city: request.headers.get("cf-ipcity"),
            region: request.headers.get("cf-region"),
            latitude: request.headers.get("cf-iplatitude"),
            longitude: request.headers.get("cf-iplongitude"),
            timezone: request.headers.get("cf-timezone"),
            postalCode: request.headers.get("cf-postal-code"),
          },
          geoFromRuntime: cf
            ? {
                country: cf.country,
                city: cf.city,
                region: cf.region,
                latitude: cf.latitude,
                longitude: cf.longitude,
                timezone: cf.timezone,
                asn: cf.asn,
                asOrganization: cf.asOrganization,
                colo: cf.colo,
              }
            : null,
          headers: redact(request.headers),
        };

        const outbound: Sent[] = [];
        if (target) {
          if (mode === "legacy" || mode === "both") {
            outbound.push(await send(target, "legacy", buildLegacyHeaders(request, url)));
          }
          if (mode === "fixed" || mode === "both") {
            outbound.push(await send(target, "fixed", buildFixedHeaders(request, url)));
          }
        }

        const body = {
          inbound,
          outbound: target ? outbound : null,
          hint: target
            ? "Compare x-forwarded-for across the two modes on your echo service."
            : requestedTarget
              ? `Rejected: ?url= must be https and one of ${ALLOWED_ECHO_HOSTS.join(", ")}.`
              : "Pass ?url=<echo endpoint> to also test outbound forwarding.",
        };

        return new Response(JSON.stringify(body, null, 2), {
          headers: {
            "content-type": "application/json",
            // Workers Cache sits in front of this Worker; without no-store a
            // hit would return a stale probe without ever running this code.
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
