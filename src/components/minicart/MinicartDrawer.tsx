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
      />
      <label
        htmlFor={MINICART_DRAWER_ID}
        aria-label="Close cart"
        className="pointer-events-none fixed inset-0 z-40 bg-black/40 opacity-0 transition-opacity duration-200 peer-checked/minicart:pointer-events-auto peer-checked/minicart:opacity-100"
      />
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md translate-x-full bg-base-100 shadow-xl transition-transform duration-200 peer-checked/minicart:translate-x-0"
        aria-label="Cart"
      >
        <Minicart />
      </aside>
    </>
  );
}
