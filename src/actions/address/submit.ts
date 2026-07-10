import { RequestContext } from "@decocms/blocks/sdk/requestContext";
import { usePlatform } from "../../apps/site";
import {
  type Address,
  type AddressBookState,
  EMPTY_ADDRESS_BOOK,
} from "../../platform/address/address.types";
import {
  readAddressCookie,
  serializeAddressCookie,
} from "../../platform/address/cookie";

export type AddressInput = Omit<Address, "id"> & { id?: string };

export type AddressOp =
  | { op: "save"; address: AddressInput }
  | { op: "remove"; id: string }
  | { op: "setDefault"; id: string };

async function action(
  props: AddressOp,
  req?: Request,
): Promise<AddressBookState> {
  const platform = usePlatform();
  if (platform === "vtex" || platform === "wake") {
    // TODO(consumer): wire the real platform address endpoints here.
  }

  const request = req ?? RequestContext.current?.request;
  const current = request ? readAddressCookie(request) : EMPTY_ADDRESS_BOOK;
  let addresses = [...current.addresses];

  if (props.op === "save") {
    const input = props.address;
    let savedId = input.id;
    if (input.id) {
      addresses = addresses.map((a) =>
        a.id === input.id ? { ...a, ...input, id: a.id } : a
      );
    } else {
      savedId = crypto.randomUUID();
      const isFirst = addresses.length === 0;
      addresses.push({
        ...input,
        id: savedId,
        isDefault: input.isDefault ?? isFirst,
      });
    }
    // When the saved address is the default, make all others non-default.
    if (addresses.find((a) => a.id === savedId)?.isDefault) {
      addresses = addresses.map((a) => ({ ...a, isDefault: a.id === savedId }));
    }
  } else if (props.op === "remove") {
    addresses = addresses.filter((a) => a.id !== props.id);
    // If we removed the default, promote the first remaining address.
    if (addresses.length > 0 && !addresses.some((a) => a.isDefault)) {
      addresses[0] = { ...addresses[0], isDefault: true };
    }
  } else if (props.op === "setDefault") {
    addresses = addresses.map((a) => ({ ...a, isDefault: a.id === props.id }));
  }

  const next: AddressBookState = { addresses };
  RequestContext.responseHeaders.append(
    "Set-Cookie",
    serializeAddressCookie(next),
  );
  return next;
}

export default action;
