import { ProductListingPage } from "@decocms/apps/commerce/types";
import { useScript } from "@decocms/start/sdk/useScript";
const SORT_QUERY_PARAM = "sort";
const PAGE_QUERY_PARAM = "page";
export type Props = Pick<ProductListingPage, "sortOptions"> & {
  url: string;
};
const BASE_FALLBACK = "http://localhost";
const parseUrl = (href: string | undefined): URL | null => {
  if (!href) return null;
  try {
    return new URL(href, BASE_FALLBACK);
  } catch {
    return null;
  }
};
const getUrl = (href: string, value: string) => {
  const url = parseUrl(href);
  if (!url) return "#";
  url.searchParams.delete(PAGE_QUERY_PARAM);
  url.searchParams.set(SORT_QUERY_PARAM, value);
  // Keep output relative when input was relative (no protocol/host in original)
  const isRelative = href.startsWith("/") || !href.includes("://");
  return isRelative ? `${url.pathname}${url.search}` : url.href;
};
const labels: Record<string, string> = {
  "relevance:desc": "Relevância",
  "price:desc": "Maior Preço",
  "price:asc": "Menor Preço",
  "orders:desc": "Mais vendidos",
  "name:desc": "Nome - de Z a A",
  "name:asc": "Nome - de A a Z",
  "release:desc": "Lançamento",
  "discount:desc": "Maior desconto",
};
function Sort({ sortOptions, url }: Props) {
  const parsed = parseUrl(url);
  const currentSort = parsed?.searchParams.get(SORT_QUERY_PARAM) ?? "";
  const current = getUrl(url, currentSort);
  const options = sortOptions?.map(({ value, label }) => ({
    value: getUrl(url, value),
    label,
  })) ?? [];
  return (
    <>
      <label htmlFor="sort" className="sr-only">Sort by</label>
      <select
        name="sort"
        className="select w-full max-w-sm rounded-lg"
        hx-on:change={useScript(() => {
          const select = event!.currentTarget as HTMLSelectElement;
          window.location.href = select.value;
        })}
      >
        {options.map(({ value, label }) => (
          <option
            key={value}
            label={labels[label] ?? label}
            value={value}
            selected={value === current}
          >
            {label}
          </option>
        ))}
      </select>
    </>
  );
}
export default Sort;
