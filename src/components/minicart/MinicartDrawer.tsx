import { MINICART_DRAWER_ID } from "../../constants";
import Minicart from "./Minicart";

export default function MinicartDrawer() {
  return (
    <>
      <input
        type="checkbox"
        id={MINICART_DRAWER_ID}
        className="peer/minicart sr-only"
        aria-hidden="true"
        tabIndex={-1}
        // Pinned to the viewport: clicking a label focuses this checkbox, and
        // an off-flow sr-only input at the end of the DOM would make the
        // browser scroll the page down to it.
        style={{ position: "fixed", top: 0, left: 0 }}
      />
      <label
        htmlFor={MINICART_DRAWER_ID}
        aria-label="Close cart"
        className="fixed inset-0 z-40 bg-black/40 opacity-0 pointer-events-none transition-opacity duration-200 peer-checked/minicart:opacity-100 peer-checked/minicart:pointer-events-auto"
      />
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md translate-x-full transition-transform duration-200 peer-checked/minicart:translate-x-0 bg-base-100 shadow-xl"
        aria-label="Cart"
      >
        <Minicart />
      </aside>
    </>
  );
}
