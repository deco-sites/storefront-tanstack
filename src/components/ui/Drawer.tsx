import { useCallback, useId, type ReactNode } from "react";
import { clx } from "~/sdk/clx";
import { useEscapeKey } from "../../sdk/useEscapeKey";
import Icon from "./Icon";

export interface Props {
  open?: boolean;
  className?: string;
  children?: ReactNode;
  aside: ReactNode;
  id?: string;
}

function Drawer(
  { children, aside, open, className: _class = "", id }: Props,
) {
  const fallbackId = useId();
  const toggleId = id ?? fallbackId;

  const closeViaCheckbox = useCallback(() => {
    const input = document.getElementById(toggleId) as HTMLInputElement | null;
    if (input) input.checked = false;
  }, [toggleId]);

  useEscapeKey(closeViaCheckbox);

  return (
    <div className={clx("drawer", _class)}>
      <input
        id={toggleId}
        name={toggleId}
        defaultChecked={open}
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
        <label htmlFor={toggleId} className="drawer-overlay" />
        {aside}
      </aside>
    </div>
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
