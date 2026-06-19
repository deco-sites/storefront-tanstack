import {
  type Address,
  type AddressBookState,
  EMPTY_ADDRESS_BOOK,
} from "./address.types";

const ADDRESS_COOKIE = "deco_addresses";
const ADDRESS_COOKIE_TTL = 60 * 60 * 24 * 365;

export function readAddressCookie(req: Request): AddressBookState {
  const header = req.headers.get("cookie") ?? "";
  const match = header
    .split(/;\s*/)
    .find((c) => c.startsWith(`${ADDRESS_COOKIE}=`));
  if (!match) return EMPTY_ADDRESS_BOOK;
  try {
    const raw = decodeURIComponent(match.slice(ADDRESS_COOKIE.length + 1));
    const addresses = JSON.parse(raw);
    return Array.isArray(addresses)
      ? { addresses: addresses as Address[] }
      : EMPTY_ADDRESS_BOOK;
  } catch {
    return EMPTY_ADDRESS_BOOK;
  }
}

export function serializeAddressCookie(state: AddressBookState): string {
  const value = encodeURIComponent(JSON.stringify(state.addresses));
  return `${ADDRESS_COOKIE}=${value}; Path=/; Max-Age=${ADDRESS_COOKIE_TTL}; SameSite=Lax`;
}
