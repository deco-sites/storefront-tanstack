import type { SiteNavigationElement } from "@decocms/apps/commerce/types";
import Image from "~/components/ui/Image";
import {
  HEADER_HEIGHT_DESKTOP,
  NAVBAR_HEIGHT_DESKTOP,
} from "../../constants";

function NavItem({ item }: { item: SiteNavigationElement }) {
  const { url, name, children } = item;
  const image = item?.image?.[0];

  return (
    <li
      className="group flex items-center pr-5"
      style={{ height: NAVBAR_HEIGHT_DESKTOP }}
    >
      <a
        href={url}
        className="group-hover:underline text-sm font-medium"
      >
        {name}
      </a>

      {children && children.length > 0 &&
        (
          <div
            className="fixed hidden hover:flex group-hover:flex bg-base-100 z-40 items-start justify-center gap-6 border-t-2 border-b-2 border-base-200 w-screen"
            style={{
              top: "0px",
              left: "0px",
              marginTop: HEADER_HEIGHT_DESKTOP,
            }}
          >
            {image?.url && (
              <Image
                className="p-6"
                src={image.url}
                alt={image.alternateName}
                width={300}
                height={332}
                loading="lazy"
              />
            )}
            <ul className="flex items-start justify-start gap-6 container">
              {children.map((node) => (
                <li className="p-6 pl-0">
                  <a className="hover:underline" href={node.url}>
                    <span>{node.name}</span>
                  </a>

                  <ul className="flex flex-col gap-1 mt-4">
                    {node.children?.map((leaf) => (
                      <li>
                        <a className="hover:underline" href={leaf.url}>
                          <span className="text-xs">{leaf.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
    </li>
  );
}

export default NavItem;
