import { RequestContext } from "@decocms/blocks/sdk/requestContext";
import { usePlatform } from "../apps/site";
import {
  type AddressBookState,
  EMPTY_ADDRESS_BOOK,
} from "../platform/address/address.types";
import { readAddressCookie } from "../platform/address/cookie";

async function loader(): Promise<AddressBookState> {
  const platform = usePlatform();

  if (platform === "vtex") {
    // TODO(consumer): call the real VTEX address-book loader.
  }
  if (platform === "wake") {
    // TODO(consumer): wire the wake address endpoint here.
  }

  // Default: cookie-backed so the demo works without a backend.
  const req = RequestContext.current?.request;
  return req ? readAddressCookie(req) : EMPTY_ADDRESS_BOOK;
}

export default loader;
