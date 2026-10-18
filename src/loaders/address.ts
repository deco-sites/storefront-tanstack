import { usePlatform } from "../apps/site";
import {
  type AddressBookState,
} from "../platform/address/address.types";
import { readAddressCookie } from "../platform/address/cookie";

async function loader(req: Request): Promise<AddressBookState> {
  const platform = usePlatform();

  if (platform === "vtex") {
    // TODO(consumer): call the real VTEX address-book loader.
  }
  if (platform === "wake") {
    // TODO(consumer): wire the wake address endpoint here.
  }

  // Default: cookie-backed so the demo works without a backend.
  return readAddressCookie(req);
}

export default loader;
