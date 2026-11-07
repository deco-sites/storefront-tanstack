import { usePlatform } from "../apps/site";
import { type AddressBookState } from "../platform/address/address.types";
import { readAddressCookie } from "../platform/address/cookie";

// v7 read the request from RequestContext; v8 has none, so the server function passes it.
async function loader(_props: unknown, request: Request): Promise<AddressBookState> {
  const platform = usePlatform();

  if (platform === "vtex") {
    // TODO(consumer): call the real VTEX address-book loader.
  }
  if (platform === "wake") {
    // TODO(consumer): wire the wake address endpoint here.
  }

  // Default: cookie-backed so the demo works without a backend.
  return readAddressCookie(request);
}

export default loader;
