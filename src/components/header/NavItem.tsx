import type { SiteNavigationElement } from "@decocms/apps/commerce/types";
import Image from "~/components/ui/Image";
import { HEADER_HEIGHT_DESKTOP, NAVBAR_HEIGHT_DESKTOP } from "../../constants";

function NavItem({ item }: { item: SiteNavigationElement }) {
  const { url, name, children } = item;
  const image = item?.image?.[0];

  return (
    <li className="group flex items-center pr-5" style={{ height: NAVBAR_HEIGHT_DESKTOP }}>
      <a href={url} className="text-sm font-medium group-hover:underline">
        {name}
      </a>

      {children && children.length > 0 && (
        <div
          className="fixed z-40 hidden w-screen items-start justify-center gap-6 border-t-2 border-b-2 border-base-200 bg-base-100 group-hover:flex hover:flex"
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
          <ul className="container flex items-start justify-start gap-6">
            {children.map((node) => (
              <li className="p-6 pl-0">
                <a className="hover:underline" href={node.url}>
                  <span>{node.name}</span>
                </a>

                <ul className="mt-4 flex flex-col gap-1">
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
