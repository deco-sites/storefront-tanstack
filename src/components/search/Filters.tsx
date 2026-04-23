import type { Filter, FilterToggle, ProductListingPage } from "@decocms/apps/commerce/types";
import { parseRange } from "@decocms/apps/commerce/utils/filters";
import { Link } from "@tanstack/react-router";
import Avatar from "../../components/ui/Avatar";
import { clx } from "~/sdk/clx";
import { formatPrice } from "@decocms/apps/commerce/sdk/formatPrice";
import { rebaseToSearch } from "~/sdk/url";

interface Props {
  filters: ProductListingPage["filters"];
  /** Current page URL — used to rebase loader-returned URLs onto this path. */
  baseUrl: string;
}

const isToggle = (filter: Filter): filter is FilterToggle => filter["@type"] === "FilterToggle";

function ValueItem({
  to,
  search,
  selected,
  label,
  quantity,
}: {
  to: string;
  search: Record<string, string>;
  selected: boolean;
  label: string;
  quantity: number;
}) {
  return (
    <Link
      to={to}
      search={search}
      preload="intent"
      rel="nofollow"
      className="flex items-center gap-2"
    >
      <input
        type="checkbox"
        className="checkbox"
        checked={selected}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
      {quantity > 0 && <span className="text-base-400 text-sm">({quantity})</span>}
    </Link>
  );
}

function FilterValues({
  filterKey,
  values,
  baseUrl,
}: {
  filterKey: string;
  values: FilterToggle["values"];
  baseUrl: string;
}) {
  const avatars = filterKey === "tamanho" || filterKey === "cor";
  const flexDirection = avatars ? "flex-row items-center" : "flex-col";

  return (
    <ul className={clx(`flex flex-wrap gap-2`, flexDirection)}>
      {values.map((item) => {
        const link = rebaseToSearch(item.url, baseUrl);
        const key = item.url ?? item.value;

        if (!link) return null;

        if (avatars) {
          return (
            <Link key={key} to={link.to} search={link.search} preload="intent" rel="nofollow">
              <Avatar content={item.value} variant={item.selected ? "active" : "default"} />
            </Link>
          );
        }

        if (filterKey === "price") {
          const range = parseRange(item.value);

          return (
            range && (
              <ValueItem
                key={item.value}
                to={link.to}
                search={link.search}
                selected={item.selected}
                quantity={item.quantity}
                label={`${formatPrice(range.from)} - ${formatPrice(range.to)}`}
              />
            )
          );
        }

        return (
          <ValueItem
            key={key}
            to={link.to}
            search={link.search}
            selected={item.selected}
            quantity={item.quantity}
            label={item.label}
          />
        );
      })}
    </ul>
  );
}

function Filters({ filters, baseUrl }: Props) {
  return (
    <ul className="flex flex-col gap-6 p-4 sm:p-0">
      {filters.filter(isToggle).map((filter) => (
        <li key={filter.key} className="flex flex-col gap-4">
          <span>{filter.label}</span>
          <FilterValues filterKey={filter.key} values={filter.values} baseUrl={baseUrl} />
        </li>
      ))}
    </ul>
  );
}

export default Filters;
