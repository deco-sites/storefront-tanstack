import type {
  Filter,
  FilterToggle,
  FilterToggleValue,
  ProductListingPage,
} from "@decocms/apps/commerce/types";
import { parseRange } from "@decocms/apps/commerce/utils/filters";
import Avatar from "../../components/ui/Avatar";
import { clx } from "~/sdk/clx";
import { formatPrice } from "@decocms/apps/commerce/sdk/formatPrice";

interface Props {
  filters: ProductListingPage["filters"];
}

const isToggle = (filter: Filter): filter is FilterToggle =>
  filter["@type"] === "FilterToggle";

function ValueItem(
  { url, selected, label, quantity }: FilterToggleValue,
) {
  return (
    <a href={url} rel="nofollow" className="flex items-center gap-2">
      <div aria-checked={selected} className="checkbox" />
      <span className="text-sm">{label}</span>
      {quantity > 0 && <span className="text-sm text-base-400">({quantity})</span>}
    </a>
  );
}

function FilterValues({ filterKey, values }: { filterKey: string; values: FilterToggle["values"] }) {
  const avatars = filterKey === "tamanho" || filterKey === "cor";
  const flexDirection = avatars ? "flex-row items-center" : "flex-col";

  return (
    <ul className={clx(`flex flex-wrap gap-2`, flexDirection)}>
      {values.map((item) => {
        const { url, selected, value } = item;

        if (avatars) {
          return (
            <a key={url} href={url} rel="nofollow">
              <Avatar
                content={value}
                variant={selected ? "active" : "default"}
              />
            </a>
          );
        }

        if (filterKey === "price") {
          const range = parseRange(item.value);

          return range && (
            <ValueItem
              key={item.value}
              {...item}
              label={`${formatPrice(range.from)} - ${formatPrice(range.to)}`}
            />
          );
        }

        return <ValueItem key={item.url} {...item} />;
      })}
    </ul>
  );
}

function Filters({ filters }: Props) {
  return (
    <ul className="flex flex-col gap-6 p-4 sm:p-0">
      {filters
        .filter(isToggle)
        .map((filter) => (
          <li key={filter.key} className="flex flex-col gap-4">
            <span>{filter.label}</span>
            <FilterValues filterKey={filter.key} values={filter.values} />
          </li>
        ))}
    </ul>
  );
}

export default Filters;
