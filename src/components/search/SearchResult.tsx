import type { ProductListingPage } from "@decocms/apps/commerce/types";
import { mapProductToAnalyticsItem } from "@decocms/apps/commerce/utils/productToAnalyticsItem";
import ProductCard from "../../components/product/ProductCard";
import Filters from "../../components/search/Filters";
import Icon from "../../components/ui/Icon";
import { clx } from "~/sdk/clx";
import { useId } from "react";
import { useOffer } from "@decocms/apps/commerce/sdk/useOffer";
import { useSendEvent } from "../../sdk/useSendEvent";
import Breadcrumb from "../ui/Breadcrumb";
import Drawer from "../ui/Drawer";
import Sort from "./Sort";
import { useDevice } from "@decocms/start/sdk/useDevice";
import { useScript, useSection } from "@decocms/start/sdk/useScript";
import { type SectionProps } from "~/types/deco";
export interface Layout {
  /**
   * @title Pagination
   * @description Format of the pagination
   */
  pagination?: "show-more" | "pagination";
}
export interface Props {
  /** @title Integration */
  page: ProductListingPage | null;
  layout?: Layout;
  /** @description 0 for ?page=0 as your first page */
  startingPage?: 0 | 1;
  /** @hidden */
  partial?: "hideMore" | "hideLess";
}
function NotFound() {
  return (
    <div className="w-full flex justify-center items-center py-10">
      <span>Not Found!</span>
    </div>
  );
}
const useUrlRebased = (overrides: string | undefined, base: string) => {
  let url: string | undefined = undefined;
  if (overrides) {
    const temp = new URL(overrides, base);
    const final = new URL(base);
    final.pathname = temp.pathname;
    temp.searchParams.forEach((value, key) => {
      final.searchParams.set(key, value);
    });
    url = final.href;
  }
  return url;
};
function PageResult(props: SectionProps<typeof loader>) {
  const { layout, startingPage = 0, url, partial } = props;
  const page = props.page!;
  const { products, pageInfo } = page;
  const perPage = pageInfo?.recordPerPage || products.length;
  const zeroIndexedOffsetPage = pageInfo.currentPage - startingPage;
  const offset = zeroIndexedOffsetPage * perPage;
  const nextPageUrl = useUrlRebased(pageInfo.nextPage, url);
  const prevPageUrl = useUrlRebased(pageInfo.previousPage, url);
  const partialPrev = useSection({
    href: prevPageUrl,
    props: { partial: "hideMore" },
  });
  const partialNext = useSection({
    href: nextPageUrl,
    props: { partial: "hideLess" },
  });
  const infinite = layout?.pagination !== "pagination";
  return (
    <div className="grid grid-flow-row grid-cols-1 place-items-center">
      <div
        className={clx(
          "pb-2 sm:pb-10",
          (!prevPageUrl || partial === "hideLess") && "hidden",
        )}
      >
        <a
          rel="prev"
          className="btn btn-ghost"
          hx-swap="outerHTML show:parent:top"
          hx-get={partialPrev}
        >
          <span className="inline [.htmx-request_&]:hidden">
            Show Less
          </span>
          <span className="loading loading-spinner hidden [.htmx-request_&]:block" />
        </a>
      </div>

      <div
        data-product-list
        className={clx(
          "grid items-center",
          "grid-cols-2 gap-2",
          "sm:grid-cols-4 sm:gap-10",
          "w-full",
        )}
      >
        {products?.map((product, index) => (
          <ProductCard
            key={`product-card-${product.productID}`}
            product={product}
            preload={index === 0}
            index={offset + index}
            className="h-full min-w-40 max-w-75"
          />
        ))}
      </div>

      <div className={clx("pt-2 sm:pt-10 w-full", "")}>
        {infinite
          ? (
            <div className="flex justify-center [&_section]:contents">
              <a
                rel="next"
                className={clx(
                  "btn btn-ghost",
                  (!nextPageUrl || partial === "hideMore") && "hidden",
                )}
                hx-swap="outerHTML show:parent:top"
                hx-get={partialNext}
              >
                <span className="inline [.htmx-request_&]:hidden">
                  Show More
                </span>
                <span className="loading loading-spinner hidden [.htmx-request_&]:block" />
              </a>
            </div>
          )
          : (
            <div className={clx("join", infinite && "hidden")}>
              <a
                rel="prev"
                aria-label="previous page link"
                href={prevPageUrl ?? "#"}
                aria-disabled={!prevPageUrl}
                className={clx(
                  "btn btn-ghost join-item",
                  !prevPageUrl && "btn-disabled",
                )}
              >
                <Icon id="chevron-right" className="rotate-180" />
              </a>
              <span className="btn btn-ghost join-item">
                Page {zeroIndexedOffsetPage + 1}
              </span>
              <a
                rel="next"
                aria-label="next page link"
                href={nextPageUrl ?? "#"}
                aria-disabled={!nextPageUrl}
                className={clx(
                  "btn btn-ghost join-item",
                  !nextPageUrl && "btn-disabled",
                )}
              >
                <Icon id="chevron-right" />
              </a>
            </div>
          )}
      </div>
    </div>
  );
}
const setPageQuerystring = (page: string, id: string) => {
  const element = document.getElementById(id)?.querySelector(
    "[data-product-list]",
  );
  if (!element) {
    return;
  }
  new IntersectionObserver((entries) => {
    const url = new URL(location.href);
    const prevPage = url.searchParams.get("page");
    for (let it = 0; it < entries.length; it++) {
      if (entries[it].isIntersecting) {
        url.searchParams.set("page", page);
      } else if (
        typeof history.state?.prevPage === "string" &&
        history.state?.prevPage !== page
      ) {
        url.searchParams.set("page", history.state.prevPage);
      }
    }
    history.replaceState({ prevPage }, "", url.href);
  }).observe(element);
};
function Result(props: SectionProps<typeof loader>) {
  const container = useId();
  const controls = useId();
  const device = useDevice();
  const { startingPage = 0, url, partial } = props;
  const page = props.page!;
  const { products, filters, breadcrumb, pageInfo, sortOptions } = page;
  const perPage = pageInfo?.recordPerPage || products.length;
  const zeroIndexedOffsetPage = pageInfo.currentPage - startingPage;
  const offset = zeroIndexedOffsetPage * perPage;
  const viewItemListEvent = useSendEvent({
    on: "view",
    event: {
      name: "view_item_list",
      params: {
        // TODO: get category name from search or cms setting
        item_list_name: breadcrumb.itemListElement?.at(-1)?.name,
        item_list_id: breadcrumb.itemListElement?.at(-1)?.item,
        items: page.products?.map((product, index) =>
          mapProductToAnalyticsItem({
            ...(useOffer(product.offers)),
            index: offset + index,
            product,
            breadcrumbList: page.breadcrumb,
          })
        ),
      },
    },
  });
  const results = (
    <span className="text-sm font-normal">
      {page.pageInfo.recordPerPage} of {page.pageInfo.records} results
    </span>
  );
  const sortBy = sortOptions.length > 0 && (
    <Sort sortOptions={sortOptions} url={url} />
  );
  return (
    <>
      <div id={container} {...viewItemListEvent} className="w-full">
        {partial
          ? <PageResult {...props} />
          : (
            <div className="container flex flex-col gap-4 sm:gap-5 w-full py-4 sm:py-5 px-5 sm:px-0">
              <Breadcrumb itemListElement={breadcrumb?.itemListElement} />

              {device === "mobile" && (
                <Drawer
                  id={controls}
                  aside={
                    <div className="bg-base-100 flex flex-col h-full divide-y overflow-y-hidden">
                      <div className="flex justify-between items-center">
                        <h1 className="px-4 py-3">
                          <span className="font-medium text-2xl">Filters</span>
                        </h1>
                        <label className="btn btn-ghost" htmlFor={controls}>
                          <Icon id="close" />
                        </label>
                      </div>
                      <div className="grow overflow-auto">
                        <Filters filters={filters} />
                      </div>
                    </div>
                  }
                >
                  <div className="flex sm:hidden justify-between items-end">
                    <div className="flex flex-col">
                      {results}
                      {sortBy}
                    </div>

                    <label className="btn btn-ghost" htmlFor={controls}>
                      Filters
                    </label>
                  </div>
                </Drawer>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr]">
                {device === "desktop" && (
                  <aside className="place-self-start flex flex-col gap-9">
                    <span className="text-base font-semibold h-12 flex items-center">
                      Filters
                    </span>

                    <Filters filters={filters} />
                  </aside>
                )}

                <div className="flex flex-col gap-9">
                  {device === "desktop" && (
                    <div className="flex justify-between items-center">
                      {results}
                      <div>
                        {sortBy}
                      </div>
                    </div>
                  )}
                  <PageResult {...props} />
                </div>
              </div>
            </div>
          )}
      </div>

      <script
        type="module"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: useScript(
            setPageQuerystring,
            `${pageInfo.currentPage}`,
            container,
          ),
        }}
      />
    </>
  );
}
function SearchResult({ page, ...props }: SectionProps<typeof loader>) {
  if (!page) {
    return <NotFound />;
  }
  return <Result {...props} page={page} />;
}
export const loader = (props: Props, req: Request) => {
  return {
    ...props,
    url: req.url,
  };
};
export default SearchResult;
