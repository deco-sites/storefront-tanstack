// Vendored from @decocms/apps-shopify 7.77.1 (client.ts) by the deco-v7-to-v8-migration skill. It's your code now.
//
// v7 configured this client once from the saved "deco-shopify" block (initShopifyFromBlocks) and
// gave it the framework's instrumented fetch (setShopifyFetch). v8 has no app blocks: the store's
// settings are code (src/clients/shopify.ts), and the client is created on first use with v8's
// instrumented fetch (provider "shopify", the operation name from each document) over v7's 10 s
// timeout. The GraphQL documents and the requests they send are v7's, byte for byte.
import { createInstrumentedFetch } from "@decocms/blocks/fetch";
import { shopifyConfig } from "../../clients/shopify";
import { withFetchTimeout } from "../blocks/fetchTimeout";
import { createGraphqlClient, type GraphQLClient } from "./utils/graphql";

export interface ShopifyConfig {
	storeName: string;
	storefrontAccessToken: string;
}

let _client: GraphQLClient | null = null;

export function getShopifyClient(): GraphQLClient {
	_client ??= createGraphqlClient(
		`https://${shopifyConfig.storeName}.myshopify.com/api/2026-04/graphql.json`,
		{
			"X-Shopify-Storefront-Access-Token": shopifyConfig.storefrontAccessToken,
		},
		createInstrumentedFetch({ provider: "shopify", fetch: withFetchTimeout() }),
	);
	return _client;
}
