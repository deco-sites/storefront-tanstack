// Vendored from @decocms/apps-shopify 7.20.7 (client.ts), then rewritten over the next-major upstream
// client, `createShopifyClient` (/next/upstream-clients#call-a-client). It's your code now.
//
// The loaders, cart and sign-in flows in src/vendor/shopify keep calling `getShopifyClient().query(…)`
// as they did in v7; underneath, every request goes through the Storefront API endpoint of the
// instrumented client (provider "shopify", one operation label per GraphQL document).
import { createShopifyClient, type ShopifyClient } from "@decocms/apps-shopify";
import { env } from "cloudflare:workers";
import { buildQuery, type GraphQLClient, type QueryDefinition } from "./utils/graphql";

/** The Storefront API version every query in utils/storefront/queries.ts was written against. */
const API_VERSION = "2025-04";

let client: ShopifyClient | undefined;

/** Settings come from the environment where the site creates the client (rule 3 of /next/upstream-clients#write-a-client). */
function shopify(): ShopifyClient {
  if (client) return client;
  const storeName = env.SHOPIFY_STORE_NAME;
  const storefrontAccessToken = env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!storeName || !storefrontAccessToken) {
    throw new Error(
      "Shopify not configured: set SHOPIFY_STORE_NAME and SHOPIFY_STOREFRONT_ACCESS_TOKEN",
    );
  }
  client = createShopifyClient({ storeName, storefrontAccessToken, apiVersion: API_VERSION });
  return client;
}

/** The Storefront API, with the v7 calling convention (a document or a fragment-composed definition). */
export function getShopifyClient(): GraphQLClient {
  return {
    query<T>(query: string | QueryDefinition, variables?: Record<string, unknown>): Promise<T> {
      return shopify().storefront.query<T>(
        typeof query === "string" ? query : buildQuery(query),
        variables,
      );
    },
  };
}
