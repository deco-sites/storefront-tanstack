import type { BreadcrumbList } from "@decocms/apps/commerce/types";
import { relative } from "../../sdk/url";

interface Props {
  itemListElement: BreadcrumbList["itemListElement"];
}

function Breadcrumb({ itemListElement = [] }: Props) {
  const items = [{ name: "Home", item: "/" }, ...itemListElement];

  return (
    <div className="breadcrumbs py-0 text-xs font-normal text-base-400">
      <ul>
        {items
          .filter(({ name, item }) => name && item)
          .map(({ name, item }) => (
            <li>
              <a href={relative(item)}>{name}</a>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default Breadcrumb;
