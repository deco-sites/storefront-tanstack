// Vendored from @decocms/apps-shopify 7.20.7 (utils/graphql.ts). The request itself is sent by the
// next-major client (see ../client.ts); what stays here is how the queries are written. It's your code now.

export function gql(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");
}

export interface QueryDefinition {
  fragments?: string[];
  query: string;
}

export function buildQuery(def: QueryDefinition): string {
  const fragments = def.fragments?.join("\n") ?? "";
  return fragments ? `${fragments}\n${def.query}` : def.query;
}

export interface GraphQLClient {
  query<T>(query: string | QueryDefinition, variables?: Record<string, unknown>): Promise<T>;
}
