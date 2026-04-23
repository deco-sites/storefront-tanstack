// TODO(phase-6 commerce): wire to real user loader (VTEX/Shopify/etc).
import type { Person } from "@decocms/apps/commerce/types";

async function loader(
  _props?: unknown,
  _req?: Request,
  _ctx?: unknown,
): Promise<Person | null> {
  return null;
}

export default loader;
