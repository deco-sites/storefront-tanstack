import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  getCookies,
  getRequest,
  getRequestHeader,
  getRequestUrl,
} from "@tanstack/react-start/server";
import { evaluateMatcher } from "@decocms/start/cms";

const LOCATION_KEY = "website/matchers/location.ts";

interface GeoSnapshot {
  source: {
    country: string;
    regionCode: string;
    city: string;
    coordinates?: string;
  };
  rawHeaders: Record<string, string>;
  rawCookies: Record<string, string>;
  // deno-lint-ignore no-explicit-any
  cf: Record<string, any> | null;
  // deno-lint-ignore no-explicit-any
  results: Array<{ label: string; rule: any; match: boolean }>;
}

const SIMULATE_PRESETS: Record<
  string,
  { regionCode: string; city: string; country: string; lat?: string; lng?: string }
> = {
  SP: { regionCode: "SP", city: "São Paulo", country: "BR", lat: "-23.5505", lng: "-46.6333" },
  RJ: { regionCode: "RJ", city: "Rio de Janeiro", country: "BR", lat: "-22.9068", lng: "-43.1729" },
  MG: { regionCode: "MG", city: "Belo Horizonte", country: "BR", lat: "-19.9167", lng: "-43.9345" },
  SC: { regionCode: "SC", city: "Florianopolis", country: "BR", lat: "-27.5954", lng: "-48.548" },
  "47": { regionCode: "47", city: "Florianopolis", country: "BR" },
};

const inspectGeo = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => data as { simulate?: string })
  .handler(async ({ data }): Promise<GeoSnapshot> => {
    const request = getRequest();
    const cookies = getCookies() as Record<string, string>;
    const url = getRequestUrl();

    const preset = data?.simulate ? SIMULATE_PRESETS[data.simulate] : undefined;
    const effectiveCookies = preset
      ? {
          ...cookies,
          __cf_geo_country: preset.country,
          __cf_geo_region_code: preset.regionCode,
          __cf_geo_city: preset.city,
          ...(preset.lat ? { __cf_geo_lat: preset.lat } : {}),
          ...(preset.lng ? { __cf_geo_lng: preset.lng } : {}),
        }
      : cookies;

    const matcherCtx = {
      userAgent: getRequestHeader("user-agent") ?? "",
      url: url.toString(),
      path: url.pathname,
      cookies: effectiveCookies,
      request: preset ? undefined : request,
    };

    const headerNames = [
      "cf-region-code",
      "cf-region",
      "cf-ipcountry",
      "cf-ipcity",
      "cf-iplatitude",
      "cf-iplongitude",
      "x-vercel-ip-country",
    ];
    const rawHeaders: Record<string, string> = {};
    for (const name of headerNames) {
      const v = getRequestHeader(name);
      if (v) rawHeaders[name] = v;
    }

    // deno-lint-ignore no-explicit-any
    const cf = (request as any)?.cf ?? null;

    // deno-lint-ignore no-explicit-any
    const rules: Array<{ label: string; rule: any }> = [
      { label: "include SP", rule: { includeLocations: [{ regionCode: "SP" }] } },
      { label: "include RJ", rule: { includeLocations: [{ regionCode: "RJ" }] } },
      { label: "include '47' (raw)", rule: { includeLocations: [{ regionCode: "47" }] } },
      { label: "include country=BR", rule: { includeLocations: [{ country: "BR" }] } },
      { label: "include country='Brasil' (alias)", rule: { includeLocations: [{ country: "Brasil" }] } },
      { label: "include SP, exclude RJ", rule: { includeLocations: [{ regionCode: "SP" }], excludeLocations: [{ regionCode: "RJ" }] } },
      { label: "empty includeLocations: [{}] (parity: matches all)", rule: { includeLocations: [{}] } },
      { label: "haversine SP center 50km", rule: { includeLocations: [{ coordinates: "-23.5505,-46.6333,50000" }] } },
      { label: "haversine Rio center 50km", rule: { includeLocations: [{ coordinates: "-22.9068,-43.1729,50000" }] } },
    ];

    const reqHeaders = request.headers;
    const headerGeo = {
      regionCode: reqHeaders.get("cf-region-code") ?? "",
      country: reqHeaders.get("cf-ipcountry") ?? reqHeaders.get("x-vercel-ip-country") ?? "",
      city: reqHeaders.get("cf-ipcity") ?? "",
      lat: reqHeaders.get("cf-iplatitude") ?? "",
      lng: reqHeaders.get("cf-iplongitude") ?? "",
    };
    const cookieGeo = {
      country: effectiveCookies.__cf_geo_country ? decodeURIComponent(effectiveCookies.__cf_geo_country) : "",
      regionCode: effectiveCookies.__cf_geo_region_code ? decodeURIComponent(effectiveCookies.__cf_geo_region_code) : "",
      city: effectiveCookies.__cf_geo_city ? decodeURIComponent(effectiveCookies.__cf_geo_city) : "",
      lat: effectiveCookies.__cf_geo_lat ? decodeURIComponent(effectiveCookies.__cf_geo_lat) : "",
      lng: effectiveCookies.__cf_geo_lng ? decodeURIComponent(effectiveCookies.__cf_geo_lng) : "",
    };
    const cfData = preset ? null : (cf as Record<string, unknown> | null);
    const hg = preset ? { regionCode: "", country: "", city: "", lat: "", lng: "" } : headerGeo;
    const country = hg.country || (cfData?.country as string ?? "") || cookieGeo.country;
    const regionCode = hg.regionCode || (cfData?.regionCode as string ?? "") || cookieGeo.regionCode;
    const city = hg.city || (cfData?.city as string ?? "") || cookieGeo.city;
    const lat = hg.lat || (cfData?.latitude != null ? String(cfData.latitude) : "") || cookieGeo.lat;
    const lng = hg.lng || (cfData?.longitude != null ? String(cfData.longitude) : "") || cookieGeo.lng;
    const coordinates = lat && lng ? `${lat},${lng}` : undefined;

    return {
      source: { country, regionCode, city, coordinates },
      rawHeaders,
      rawCookies: cookies,
      cf,
      results: rules.map(({ label, rule }) => ({
        label,
        rule,
        match: evaluateMatcher({ ...rule, __resolveType: LOCATION_KEY }, matcherCtx),
      })),
    };
  });

export const Route = createFileRoute("/geo-debug")({
  validateSearch: (search: Record<string, unknown>) => ({
    simulate: typeof search.simulate === "string" ? search.simulate : undefined,
  }),
  loaderDeps: ({ search }) => ({ simulate: search.simulate }),
  loader: ({ deps }) => inspectGeo({ data: { simulate: deps.simulate } }),
  component: GeoDebug,
});

const palette = {
  green: { background: "#16a34a", color: "white" },
  red: { background: "#dc2626", color: "white" },
};

function RegionGreeting({ source }: { source: GeoSnapshot["source"] }) {
  const isSP = source.regionCode === "SP";
  const isRJ = source.regionCode === "RJ";

  const message = isRJ
    ? "Olá, Rio de Janeiro! Frete grátis para todo o estado."
    : isSP
      ? "E aí, São Paulo! Retire na loja do Morumbi a partir de hoje."
      : "Bem-vindo! Veja nossas ofertas nacionais.";

  const bg = isRJ ? "#0ea5e9" : isSP ? "#f97316" : "#475569";

  return (
    <div
      style={{
        background: bg,
        color: "white",
        padding: "20px 24px",
        borderRadius: 8,
        marginBottom: 24,
        fontFamily: "system-ui, sans-serif",
        fontSize: 18,
        fontWeight: 600,
      }}
    >
      {message}
      <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.9, marginTop: 6 }}>
        regionCode resolvido: <code>{source.regionCode || "(none)"}</code>
        {" "}— este banner muda conforme a CMS o trocaria via variant.
      </div>
    </div>
  );
}

function GeoDebug() {
  const data = Route.useLoaderData() as GeoSnapshot;

  return (
    <div
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        padding: 24,
        maxWidth: 920,
        margin: "0 auto",
        lineHeight: 1.45,
      }}
    >
      <RegionGreeting source={data.source} />

      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Location matcher — live</h1>
      <p style={{ color: "#666", marginBottom: 12, fontSize: 13 }}>
        Try the simulate shortcuts (override real geo for testing):
      </p>
      <p style={{ marginBottom: 16, fontSize: 13 }}>
        {["SP", "RJ", "MG", "SC", "47"].map((id) => (
          <a
            key={id}
            href={`/geo-debug?simulate=${id}`}
            style={{
              marginRight: 8,
              padding: "4px 10px",
              background: "#1f2937",
              color: "white",
              borderRadius: 4,
              textDecoration: "none",
            }}
          >
            simulate={id}
          </a>
        ))}
        <a
          href="/geo-debug"
          style={{
            marginRight: 8,
            padding: "4px 10px",
            background: "#6b7280",
            color: "white",
            borderRadius: 4,
            textDecoration: "none",
          }}
        >
          real geo
        </a>
      </p>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Resolved geo source</h2>
      <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 6 }}>
        {JSON.stringify(data.source, null, 2)}
      </pre>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Matcher evaluations</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={th}>Rule</th>
            <th style={th}>Match?</th>
            <th style={th}>JSON</th>
          </tr>
        </thead>
        <tbody>
          {data.results.map((r, i) => (
            <tr key={i}>
              <td style={td}>{r.label}</td>
              <td
                style={{
                  ...td,
                  ...(r.match ? palette.green : palette.red),
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {r.match ? "TRUE" : "FALSE"}
              </td>
              <td style={{ ...td, fontSize: 11 }}>
                <code>{JSON.stringify(r.rule)}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Raw inputs</h2>
      <details open>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          headers ({Object.keys(data.rawHeaders).length})
        </summary>
        <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 6 }}>
          {JSON.stringify(data.rawHeaders, null, 2)}
        </pre>
      </details>
      <details>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          cookies ({Object.keys(data.rawCookies).length})
        </summary>
        <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 6 }}>
          {JSON.stringify(data.rawCookies, null, 2)}
        </pre>
      </details>
      <details>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>request.cf</summary>
        <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 6 }}>
          {data.cf ? JSON.stringify(data.cf, null, 2) : "null (not on Cloudflare)"}
        </pre>
      </details>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #e5e7eb",
  background: "#f9fafb",
  fontWeight: 600,
};

const td: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
};
