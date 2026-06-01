/**
 * Location matcher override — mirrors deco-cx/apps/website/matchers/location.ts.
 *
 * This file exists in miami to override the @decocms/start@5.2.1 built-in
 * implementation while we validate the parity fix from
 * deco-start-v1/brisbane (will land in a future @decocms/start release).
 *
 * After that release, this file can be deleted.
 */

import { registerMatcher, type MatcherContext } from "@decocms/start/cms";

interface LocationOrMap {
  country?: string;
  regionCode?: string;
  city?: string;
  coordinates?: string;
}

interface GeoSource {
  country: string;
  regionCode: string;
  city: string;
  coordinates?: string;
}

/** Minimal country alias set — enough for the BR-heavy storefront. */
const COUNTRY_ALIAS: Record<string, string> = {
  brasil: "BR",
  brazil: "BR",
  "estados unidos": "US",
  "united states": "US",
  usa: "US",
  argentina: "AR",
  uruguay: "UY",
  paraguay: "PY",
};

function resolveCountryCode(input: string): string {
  return COUNTRY_ALIAS[input.toLowerCase()] ?? input;
}

function decodeCookie(value: string | undefined): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getGeoData(ctx: MatcherContext): GeoSource {
  const headers = ctx.headers ?? {};
  const reqHeaders = ctx.request?.headers;
  const h = (name: string): string =>
    headers[name] ?? reqHeaders?.get(name) ?? "";

  let regionCode = h("cf-region-code");
  let country = h("cf-ipcountry") || h("x-vercel-ip-country");
  let city = h("cf-ipcity");
  let latitude = h("cf-iplatitude");
  let longitude = h("cf-iplongitude");

  if (!country || !regionCode) {
    const req = ctx.request;
    // deno-lint-ignore no-explicit-any
    const cf = req ? ((req as any).cf as Record<string, unknown> | undefined) : undefined;
    if (cf) {
      country = country || ((cf.country as string) ?? "");
      regionCode = regionCode || ((cf.regionCode as string) ?? "");
      city = city || ((cf.city as string) ?? "");
      latitude = latitude || (cf.latitude != null ? String(cf.latitude) : "");
      longitude = longitude || (cf.longitude != null ? String(cf.longitude) : "");
    }
  }

  if (!country || !regionCode || !city || !latitude) {
    const cookies = ctx.cookies ?? {};
    country = country || decodeCookie(cookies.__cf_geo_country);
    regionCode = regionCode || decodeCookie(cookies.__cf_geo_region_code);
    city = city || decodeCookie(cookies.__cf_geo_city);
    latitude = latitude || decodeCookie(cookies.__cf_geo_lat);
    longitude = longitude || decodeCookie(cookies.__cf_geo_lng);
  }

  const coordinates = latitude && longitude ? `${latitude},${longitude}` : undefined;
  return { country, regionCode, city, coordinates };
}

function haversineWithinRadius(source: string, target: string): boolean {
  const [slat, slng] = source.split(",").map(Number);
  const [tlat, tlng, radiusMeters] = target.split(",").map(Number);
  if (
    !Number.isFinite(slat) ||
    !Number.isFinite(slng) ||
    !Number.isFinite(tlat) ||
    !Number.isFinite(tlng) ||
    !Number.isFinite(radiusMeters)
  ) {
    return false;
  }
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(tlat - slat);
  const dLng = toRad(tlng - slng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(slat)) * Math.cos(toRad(tlat)) * Math.sin(dLng / 2) ** 2;
  const distance = 2 * R * Math.asin(Math.sqrt(a));
  return distance <= radiusMeters;
}

function matchLocation(defaultNotMatched: boolean, source: GeoSource) {
  return (target: LocationOrMap): boolean => {
    const hasRegion = !!target.regionCode;
    const hasCity = !!target.city;
    const hasCountry = !!target.country;
    const hasCoords = !!target.coordinates;

    if (!hasRegion && !hasCity && !hasCountry && !hasCoords) {
      return defaultNotMatched;
    }

    let result =
      !hasRegion ||
      target.regionCode!.toLowerCase() === source.regionCode.toLowerCase();

    result = result &&
      (!source.coordinates ||
        !hasCoords ||
        haversineWithinRadius(source.coordinates, target.coordinates!));

    result = result &&
      (!hasCity || target.city!.toLowerCase() === source.city.toLowerCase());

    result = result &&
      (!hasCountry ||
        resolveCountryCode(target.country!).toUpperCase() ===
          source.country.toUpperCase());

    return result;
  };
}

export function evaluateLocationRule(
  rule: { includeLocations?: LocationOrMap[]; excludeLocations?: LocationOrMap[] },
  ctx: MatcherContext,
): boolean {
  const source = getGeoData(ctx);
  if (rule.excludeLocations?.some(matchLocation(false, source))) return false;
  if (!rule.includeLocations || rule.includeLocations.length === 0) return true;
  return rule.includeLocations.some(matchLocation(true, source));
}

export function getGeoSourceFromCtx(ctx: MatcherContext): GeoSource {
  return getGeoData(ctx);
}

/** Register the fixed location matcher, overriding the built-in. */
export function registerLocationMatcher(): void {
  registerMatcher(
    "website/matchers/location.ts",
    (rule, ctx) =>
      evaluateLocationRule(
        rule as { includeLocations?: LocationOrMap[]; excludeLocations?: LocationOrMap[] },
        ctx,
      ),
  );
}
