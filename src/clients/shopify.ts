/**
 * The Shopify store this site sells from: v7's saved app block "deco-shopify", moved to code (the
 * next major has no app blocks). v7 read only the store name and the Storefront API token from it
 * (initShopifyFromBlocks); the Storefront token is public (it ships to browsers by design). The
 * block's Admin API token (a v7 secret, SHOPIFY_ACCESS_TOKEN) was never used by this site and isn't
 * carried over.
 *
 * The vendored v7 client (src/vendor/shopify/client.ts) sends every request with these settings.
 * Moving to v8's thin client (createShopifyClient from @decocms/apps-shopify) is a follow-up.
 */
import type { ShopifyConfig } from "../vendor/shopify/client";

export const shopifyConfig: ShopifyConfig = {
  storeName: "gimenesdevstore",
  storefrontAccessToken: "71f2c3da0dab3b4eee7dce35eb8c6113",
};
