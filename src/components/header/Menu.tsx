import Icon from "../../components/ui/Icon";
import type { SiteNavigationElement } from "@decocms/apps/commerce/types";

export interface Props {
  navItems?: SiteNavigationElement[];
}

function MenuItem({ item }: { item: SiteNavigationElement }) {
  return (
    <div className="collapse collapse-plus">
      <input type="checkbox" />
      <div className="collapse-title">{item.name}</div>
      <div className="collapse-content">
        <ul>
          <li>
            <a className="underline text-sm" href={item.url}>Ver todos</a>
          </li>
          {item.children?.map((node) => (
            <li>
              <MenuItem item={node} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Menu({ navItems = [] }: Props) {
  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ minWidth: "100vw" }}
    >
      <ul className="px-4 grow flex flex-col divide-y divide-base-200 overflow-y-auto">
        {navItems.map((item) => (
          <li>
            <MenuItem item={item} />
          </li>
        ))}
      </ul>

      <ul className="flex flex-col py-2 bg-base-200">
        <li>
          <a
            className="flex items-center gap-4 px-4 py-2"
            href="/wishlist"
          >
            <Icon id="favorite" />
            <span className="text-sm">Lista de desejos</span>
          </a>
        </li>
        <li>
          <a
            className="flex items-center gap-4 px-4 py-2"
            href="https://www.deco.cx"
          >
            <Icon id="home_pin" />
            <span className="text-sm">Nossas lojas</span>
          </a>
        </li>
        <li>
          <a
            className="flex items-center gap-4 px-4 py-2"
            href="https://www.deco.cx"
          >
            <Icon id="call" />
            <span className="text-sm">Fale conosco</span>
          </a>
        </li>
        <li>
          <a
            className="flex items-center gap-4 px-4 py-2"
            href="https://www.deco.cx"
          >
            <Icon id="account_circle" />
            <span className="text-sm">Minha conta</span>
          </a>
        </li>
      </ul>
    </div>
  );
}

export default Menu;
