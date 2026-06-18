import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
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

  // Swipe-to-close: a horizontal swipe toward the edge the drawer opened from
  // closes it (the expected mobile gesture). Gesture-only — we let DaisyUI run
  // its own close transition rather than fighting it with a live drag transform.
  const asideRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const aside = asideRef.current;
    const root = aside?.closest(".drawer");
    if (!aside || !root) return;
    const closesRightward = root.classList.contains("drawer-end");
    let startX = 0;
    let startY = 0;
    let tracking = false;
    const onDown = (e: PointerEvent) => {
      const input = document.getElementById(toggleId) as HTMLInputElement | null;
      if (!input?.checked) return; // only while open
      startX = e.clientX;
      startY = e.clientY;
      tracking = true;
    };
    const onUp = (e: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      // Require a clearly horizontal swipe so vertical scrolling is unaffected.
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
      if (closesRightward ? dx > 0 : dx < 0) closeViaCheckbox();
    };
    aside.addEventListener("pointerdown", onDown);
    aside.addEventListener("pointerup", onUp);
    return () => {
      aside.removeEventListener("pointerdown", onDown);
      aside.removeEventListener("pointerup", onUp);
    };
  }, [toggleId, closeViaCheckbox]);

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
        ref={asideRef}
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
