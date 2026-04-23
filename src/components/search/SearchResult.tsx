import type { ProductListingPage } from "@decocms/apps/commerce/types";
import { mapProductToAnalyticsItem } from "@decocms/apps/commerce/utils/productToAnalyticsItem";
import { useId } from "react";
import { useOffer } from "@decocms/apps/commerce/sdk/useOffer";
import { useRouterState } from "@tanstack/react-router";
import { useSendEvent } from "../../sdk/useSendEvent";
import { type SectionProps } from "~/types/deco";
import Breadcrumb from "../ui/Breadcrumb";
import Filters from "./Filters";
import SearchFilterDrawer from "./SearchFilterDrawer";
import SearchPagination, { rebasePaginationHrefs } from "./SearchPagination";
import SearchResultGrid from "./SearchResultGrid";
import SearchResultGridSkeleton from "./SearchResultGridSkeleton";
import SearchSortBar from "./SearchSortBar";

export interface Layout {
  /**
   * @title Pagination
   * @description Format of the pagination
   * @default "show-more"
   */
  pagination?: "show-more" | "pagination";
}

export interface Props {
  /** @title Integration */
  page: ProductListingPage | null;
  /** @title Layout */
  layout?: Layout;
  /**
   * @title Starting page
   * @description 0 for ?page=0 as your first page
   * @default 0
   */
  startingPage?: 0 | 1;
}

function NotFound() {
  return (
    <div className="w-full flex justify-center items-center py-10">
      <span>Not Found!</span>
    </div>
  );
}

function Result({
  page,
  layout,
  startingPage = 0,
  url,
}: SectionProps<typeof loader> & { page: ProductListingPage }) {
  const filterDrawerId = useId();

  // Use the live URL for filter/sort/pagination link rebasing. The section
  // loader's `url` is the SSR URL — on client navigation the page re-renders
  // with the new route loader's data, and this hook drives client-side links.
  const href = useRouterState({ select: (s) => s.location.href }) || url;

  // Show a grid-only skeleton while the route is transitioning to a new URL
  // (filter/sort/pagination click). Filters/breadcrumb/sort stay mounted.
  const isRouteLoading = useRouterState({ select: (s) => s.isLoading });

  const { products, filters, breadcrumb, pageInfo, sortOptions } = page;
  const perPage = pageInfo?.recordPerPage || products.length;
  const zeroIndexedOffsetPage = pageInfo.currentPage - startingPage;
  const offset = zeroIndexedOffsetPage * perPage;
  const { prev, next } = rebasePaginationHrefs(
    pageInfo.previousPage,
    pageInfo.nextPage,
    href,
  );

  const viewItemListEvent = useSendEvent({
    on: "view",
    event: {
      name: "view_item_list",
      params: {
        item_list_name: breadcrumb.itemListElement?.at(-1)?.name,
        item_list_id: breadcrumb.itemListElement?.at(-1)?.item,
        items: products?.map((product, index) =>
          mapProductToAnalyticsItem({
            ...useOffer(product.offers),
            index: offset + index,
            product,
            breadcrumbList: breadcrumb,
          })
        ),
      },
    },
  });

  return (
    <div {...viewItemListEvent} className="w-full">
      <div className="container flex flex-col gap-4 sm:gap-5 w-full py-4 sm:py-5 px-5 sm:px-0">
        <Breadcrumb itemListElement={breadcrumb?.itemListElement} />

        <SearchFilterDrawer id={filterDrawerId} filters={filters} baseUrl={href} />

        <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr]">
          <aside className="hidden sm:flex place-self-start flex-col gap-9">
            <span className="text-base font-semibold h-12 flex items-center">
              Filters
            </span>
            <Filters filters={filters} baseUrl={href} />
          </aside>

          <div className="flex flex-col gap-9">
            <SearchSortBar
              recordPerPage={pageInfo.recordPerPage ?? products.length}
              totalRecords={pageInfo.records ?? products.length}
              sortOptions={sortOptions}
              url={href}
              filterDrawerId={filterDrawerId}
            />

            {isRouteLoading
              ? <SearchResultGridSkeleton count={Math.min(perPage, 12) || 8} />
              : <SearchResultGrid products={products} offset={offset} />}

            <div className="grid place-items-center pt-2 sm:pt-10">
              <SearchPagination
                currentPage={zeroIndexedOffsetPage + 1}
                prev={prev}
                next={next}
                variant={layout?.pagination ?? "show-more"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const loader = (props: Props, req: Request) => ({
  ...props,
  url: req.url,
});

export default function SearchResult({
  page,
  ...props
}: SectionProps<typeof loader>) {
  if (!page) return <NotFound />;
  return <Result {...props} page={page} />;
}
