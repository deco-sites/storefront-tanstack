import { EMPTY_WISHLIST, type WishlistState } from "../platform/wishlist";

export const WISHLIST_COOKIE = "deco_wishlist";
export const WISHLIST_COOKIE_TTL = 60 * 60 * 24 * 365;

export function readWishlistCookie(req: Request): WishlistState {
  const header = req.headers.get("cookie") ?? "";
  const match = header.split(/;\s*/).find((c) => c.startsWith(`${WISHLIST_COOKIE}=`));
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
