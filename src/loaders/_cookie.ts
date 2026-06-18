import { EMPTY_WISHLIST, type WishlistState } from "../platform/wishlist";

export const WISHLIST_COOKIE = "deco_wishlist";
export const WISHLIST_COOKIE_TTL = 60 * 60 * 24 * 365;

export function readWishlistCookie(req: Request): WishlistState {
  const header = req.headers.get("cookie") ?? "";
  const match = header
    .split(/;\s*/)
    .find((c) => c.startsWith(`${WISHLIST_COOKIE}=`));
  if (!match) return EMPTY_WISHLIST;
  try {
    const raw = decodeURIComponent(match.slice(WISHLIST_COOKIE.length + 1));
    const ids = JSON.parse(raw);
    return Array.isArray(ids) && ids.every((x) => typeof x === "string")
      ? { productIDs: ids }
      : EMPTY_WISHLIST;
  } catch {
    return EMPTY_WISHLIST;
  }
}

export function serializeWishlistCookie(state: WishlistState): string {
  const value = encodeURIComponent(JSON.stringify(state.productIDs));
  return `${WISHLIST_COOKIE}=${value}; Path=/; Max-Age=${WISHLIST_COOKIE_TTL}; SameSite=Lax`;
}

export const NEWSLETTER_COOKIE = "deco_newsletter";
export const NEWSLETTER_COOKIE_TTL = 60 * 60 * 24 * 365;

export function readNewsletterCookie(req: Request): string[] {
  const header = req.headers.get("cookie") ?? "";
  const match = header
    .split(/;\s*/)
    .find((c) => c.startsWith(`${NEWSLETTER_COOKIE}=`));
  if (!match) return [];
  try {
    const raw = decodeURIComponent(match.slice(NEWSLETTER_COOKIE.length + 1));
    const emails = JSON.parse(raw);
    return Array.isArray(emails) && emails.every((x) => typeof x === "string")
      ? emails
      : [];
  } catch {
    return [];
  }
}

export function serializeNewsletterCookie(emails: string[]): string {
  const value = encodeURIComponent(JSON.stringify(emails));
  return `${NEWSLETTER_COOKIE}=${value}; Path=/; Max-Age=${NEWSLETTER_COOKIE_TTL}; SameSite=Lax`;
}
