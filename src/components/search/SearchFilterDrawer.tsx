import type { ProductListingPage } from "@decocms/apps/commerce/types";
import Filters from "./Filters";
import Icon from "../ui/Icon";

export interface Props {
  id: string;
  filters: ProductListingPage["filters"];
  baseUrl: string;
}

export default function SearchFilterDrawer({ id, filters, baseUrl }: Props) {
  return (
    <>
      <input type="checkbox" id={id} className="peer/filter-drawer sr-only" aria-hidden="true" />
      <label
        htmlFor={id}
        aria-label="Close filters"
        className="pointer-events-none fixed inset-0 z-40 bg-black/40 opacity-0 transition-opacity duration-200 peer-checked/filter-drawer:pointer-events-auto peer-checked/filter-drawer:opacity-100 sm:hidden"
      />
      <aside
        className="fixed top-0 bottom-0 left-0 z-50 w-full max-w-md -translate-x-full bg-base-100 shadow-xl transition-transform duration-200 peer-checked/filter-drawer:translate-x-0 sm:hidden"
        aria-label="Filters"
      >
        <div className="flex h-full flex-col divide-y overflow-y-hidden">
          <div className="flex items-center justify-between">
            <h2 className="px-4 py-3 text-2xl font-medium">Filters</h2>
            <label htmlFor={id} className="btn btn-ghost" aria-label="Close">
              <Icon id="close" />
            </label>
          </div>
          <div className="grow overflow-auto">
            <Filters filters={filters} baseUrl={baseUrl} />
          </div>
        </div>
      </aside>
    </>
  );
}
