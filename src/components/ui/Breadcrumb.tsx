import type { BreadcrumbList } from "@decocms/apps/commerce/types";
import { Link } from "@tanstack/react-router";
import { relative } from "../../sdk/url";

interface Props {
  itemListElement: BreadcrumbList["itemListElement"];
}

function Breadcrumb({ itemListElement = [] }: Props) {
  const items = [{ name: "Home", item: "/" }, ...itemListElement];

  return (
    <div className="text-base-400 breadcrumbs py-0 text-xs font-normal">
      <ul>
        {items
          .filter(({ name, item }) => name && item)
          .map(({ name, item }) => (
            <li key={item}>
              <Link to={relative(item) ?? "/"} preload="intent">
                {name}
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default Breadcrumb;
