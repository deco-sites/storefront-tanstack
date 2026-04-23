import type { ProductListingPage } from "@decocms/apps/commerce/types";
import Sort from "./Sort";

export interface Props {
  recordPerPage: number;
  totalRecords: number;
  sortOptions: ProductListingPage["sortOptions"];
  url: string;
  filterDrawerId?: string;
}

export default function SearchSortBar({
  recordPerPage,
  totalRecords,
  sortOptions,
  url,
  filterDrawerId,
}: Props) {
  return (
    <div className="flex justify-between items-end gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-normal">
          {recordPerPage} of {totalRecords} results
        </span>
        {sortOptions.length > 0 && <Sort sortOptions={sortOptions} url={url} />}
      </div>

      {filterDrawerId && (
        <label
          htmlFor={filterDrawerId}
          className="btn btn-ghost sm:hidden"
        >
          Filters
        </label>
      )}
    </div>
  );
}
