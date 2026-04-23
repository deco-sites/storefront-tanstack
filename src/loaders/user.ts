import { userLoader as shopifyUserLoader } from "@decocms/apps/shopify";
import type { Person } from "@decocms/apps/commerce/types";

async function loader(
  _props?: unknown,
  req?: Request,
): Promise<Person | null> {
  if (!req) return null;
  const u = await shopifyUserLoader(req.headers);
  if (!u) return null;
  return {
    "@id": u["@id"],
    email: u.email,
    givenName: u.givenName,
    familyName: u.familyName,
  };
}

export default loader;
