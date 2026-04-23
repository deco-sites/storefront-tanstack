import type { HTMLWidget, ImageWidget } from "~/types/widgets";
import type { SiteNavigationElement } from "@decocms/apps/commerce/types";
import Image from "~/components/ui/Image";
import Alert from "../../components/header/Alert";
import Bag from "../../components/header/Bag";
import Menu from "../../components/header/Menu";
import NavItem from "../../components/header/NavItem";
import SignIn from "../../components/header/SignIn";
import Searchbar, {
  type SearchbarProps,
} from "../../components/search/Searchbar/Form";
import Drawer from "../../components/ui/Drawer";
import Icon from "../../components/ui/Icon";
import Modal from "../../components/ui/Modal";
import {
  HEADER_HEIGHT_DESKTOP,
  HEADER_HEIGHT_MOBILE,
  NAVBAR_HEIGHT_MOBILE,
  SEARCHBAR_DRAWER_ID,
  SEARCHBAR_POPUP_ID,
  SIDEMENU_CONTAINER_ID,
  SIDEMENU_DRAWER_ID,
} from "../../constants";
import { useDevice } from "@decocms/start/sdk/useDevice";
import { type LoadingFallbackProps } from "~/types/deco";
export interface Logo {
  src: ImageWidget;
  alt: string;
  width?: number;
  height?: number;
}
export interface SectionProps {
  alerts?: HTMLWidget[];
  /**
   * @title Navigation items
   * @description Navigation items used both on mobile and desktop menus
   */
  navItems?: SiteNavigationElement[] | null;
  /**
   * @title Searchbar
   * @description Searchbar configuration
   */
  searchbar: SearchbarProps;
  /** @title Logo */
  logo: Logo;
  /**
   * @description Usefull for lazy loading hidden elements, like hamburguer menus etc
   * @hide true */
  loading?: "eager" | "lazy";
}
type Props = Omit<SectionProps, "alert">;
const Desktop = ({ navItems, logo, searchbar, loading }: Props) => (
  <>
    <Modal id={SEARCHBAR_POPUP_ID}>
      <div
        className="absolute top-0 bg-base-100 container"
        style={{ marginTop: HEADER_HEIGHT_MOBILE }}
      >
        {loading === "lazy"
          ? (
            <div className="flex justify-center items-center">
              <span className="loading loading-spinner" />
            </div>
          )
          : <Searchbar {...searchbar} />}
      </div>
    </Modal>

    <div className="flex flex-col gap-4 pt-5 container border-b border-gray-300">
      <div className="grid grid-cols-3 place-items-center">
        <div className="place-self-start">
          <a href="/" aria-label="Store logo">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width || 100}
              height={logo.height || 23}
            />
          </a>
        </div>

        <label
          htmlFor={SEARCHBAR_POPUP_ID}
          className="input input-bordered flex items-center gap-2 w-full"
          aria-label="search icon button"
        >
          <Icon id="search" />
          <span className="text-base-400 truncate">
            Search products, brands...
          </span>
        </label>

        <div className="flex gap-4 place-self-end items-center">
          <SignIn variant="desktop" />
          <Bag />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <ul className="flex">
          {navItems?.slice(0, 10).map((item, index) => (
            <NavItem key={index} item={item} />
          ))}
        </ul>
        <div>
          {/* ship to */}
        </div>
      </div>
    </div>
  </>
);
const Mobile = ({ logo, searchbar, navItems, loading }: Props) => (
  <>
    <Drawer
      id={SEARCHBAR_DRAWER_ID}
      aside={
        <Drawer.Aside title="Search" drawer={SEARCHBAR_DRAWER_ID}>
          <div className="w-screen overflow-y-auto">
            {loading === "lazy"
              ? (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="loading loading-spinner" />
                </div>
              )
              : <Searchbar {...searchbar} />}
          </div>
        </Drawer.Aside>
      }
    />
    <Drawer
      id={SIDEMENU_DRAWER_ID}
      aside={
        <Drawer.Aside title="Menu" drawer={SIDEMENU_DRAWER_ID}>
          {loading === "lazy"
            ? (
              <div
                id={SIDEMENU_CONTAINER_ID}
                className="h-full flex items-center justify-center"
                style={{ minWidth: "100vw" }}
              >
                <span className="loading loading-spinner" />
              </div>
            )
            : <Menu navItems={navItems ?? []} />}
        </Drawer.Aside>
      }
    />

    <div
      className="grid place-items-center w-screen px-5 gap-4"
      style={{
        height: NAVBAR_HEIGHT_MOBILE,
        gridTemplateColumns:
          "min-content auto min-content min-content min-content",
      }}
    >
      <label
        htmlFor={SIDEMENU_DRAWER_ID}
        className="btn btn-square btn-sm btn-ghost"
        aria-label="open menu"
      >
        <Icon id="menu" />
      </label>

      {logo && (
        <a
          href="/"
          className="grow inline-flex items-center justify-center"
          style={{ minHeight: NAVBAR_HEIGHT_MOBILE }}
          aria-label="Store logo"
        >
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width || 100}
            height={logo.height || 13}
          />
        </a>
      )}

      <label
        htmlFor={SEARCHBAR_DRAWER_ID}
        className="btn btn-square btn-sm btn-ghost"
        aria-label="search icon button"
      >
        <Icon id="search" />
      </label>
      <SignIn variant="mobile" />
      <Bag />
    </div>
  </>
);
function Header({
  alerts = [],
  logo = {
    src:
      "https://ozksgdmyrqcxcwhnbepg.supabase.co/storage/v1/object/public/assets/2291/986b61d4-3847-4867-93c8-b550cb459cc7",
    width: 100,
    height: 16,
    alt: "Logo",
  },
  ...props
}: Props) {
  const device = useDevice();
  return (
    <header
      style={{
        height: device === "desktop"
          ? HEADER_HEIGHT_DESKTOP
          : HEADER_HEIGHT_MOBILE,
      }}
    >
      <div className="bg-base-100 fixed w-full z-40">
        {alerts.length > 0 && <Alert alerts={alerts} />}
        {device === "desktop"
          ? <Desktop logo={logo} {...props} />
          : <Mobile logo={logo} {...props} />}
      </div>
    </header>
  );
}
export const LoadingFallback = (props: LoadingFallbackProps<Props>) => (
  <Header {...props as any} loading="lazy" />
);
export default Header;

export const eager = true;
export const sync = true;
export const layout = true;
