/**
 * Location matcher override — mirrors decocms/deco-start#209 (deco-cx/apps parity).
 *
 * This file is a temporary local copy of the fixed matcher while
 * @decocms/start@5.2.1 ships a buggy built-in. Once we bump to the
 * release with the fix, delete this file and remove the setup.ts wiring.
 *
 * DO NOT MERGE this branch to main — it exists only for the preview deploy.
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

const COUNTRY_ALIAS: Record<string, string> = {
  brasil: "BR",
  brazil: "BR",
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

  if (!country || !regionCode || !city || !latitude || !longitude) {
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

  if (!country || !regionCode || !city || !latitude || !longitude) {
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
      (!hasCoords ||
        (!!source.coordinates &&
          haversineWithinRadius(source.coordinates, target.coordinates!)));

    result = result &&
      (!hasCity || target.city!.toLowerCase() === source.city.toLowerCase());

    result = result &&
      (!hasCountry ||
        resolveCountryCode(target.country!).toUpperCase() ===
          source.country.toUpperCase());

    return result;
  };
}

function locationMatcher(
  rule: { includeLocations?: LocationOrMap[]; excludeLocations?: LocationOrMap[] },
  ctx: MatcherContext,
): boolean {
  const source = getGeoData(ctx);
  if (rule.excludeLocations?.some(matchLocation(false, source))) return false;
  if (!rule.includeLocations || rule.includeLocations.length === 0) return true;
  return rule.includeLocations.some(matchLocation(true, source));
}

export function registerLocationMatcher(): void {
  registerMatcher(
    "website/matchers/location.ts",
    (rule, ctx) =>
      locationMatcher(
        rule as { includeLocations?: LocationOrMap[]; excludeLocations?: LocationOrMap[] },
        ctx,
      ),
  );
}
