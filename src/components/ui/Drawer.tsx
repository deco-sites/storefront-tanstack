import { type ReactNode } from "react";
import { clx } from "~/sdk/clx";
import { useId } from "react";
import Icon from "./Icon";
import { useScript } from "@decocms/start/sdk/useScript";
export interface Props {
  open?: boolean;
  className?: string;
  children?: ReactNode;
  aside: ReactNode;
  id?: string;
}
const script = (id: string) => {
  const handler = (e: KeyboardEvent) => {
    if (e.key !== "Escape" && e.keyCode !== 27) {
      return;
    }
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) {
      return;
    }
    input.checked = false;
  };
  addEventListener("keydown", handler);
};
function Drawer(
  { children, aside, open, className: _class = "", id = useId() }: Props,
) {
  return (
    <>
      <div className={clx("drawer", _class)}>
        <input
          id={id}
          name={id}
          checked={open}
          type="checkbox"
          className="drawer-toggle"
          aria-label={open ? "open drawer" : "closed drawer"}
        />

        <div className="drawer-content">
          {children}
        </div>

        <aside
          data-aside
          className={clx(
            "drawer-side h-full z-40 overflow-hidden",
            "[[data-aside]&_section]:contents",
          )}
        >
          <label htmlFor={id} className="drawer-overlay" />
          {aside}
        </aside>
      </div>
      <script
        type="module"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: useScript(script, id) }}
      />
    </>
  );
}
function Aside({ title, drawer, children }: {
  title: string;
  drawer: string;
  children: ReactNode;
}) {
  return (
    <div
      data-aside
      className="bg-base-100 grid grid-rows-[auto_1fr] h-full divide-y"
      style={{ maxWidth: "100vw" }}
    >
      <div className="flex justify-between items-center">
        <h1 className="px-4 py-3">
          <span className="font-medium text-2xl">{title}</span>
        </h1>
        <label htmlFor={drawer} aria-label="X" className="btn btn-ghost">
          <Icon id="close" />
        </label>
      </div>
      {children}
    </div>
  );
}
Drawer.Aside = Aside;
export default Drawer;
