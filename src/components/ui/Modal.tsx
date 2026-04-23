import { ReactNode } from "react";
import { useId } from "react";
import { useScript } from "@decocms/start/sdk/useScript";
interface Props {
  open?: boolean;
  children?: ReactNode;
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
function Modal({ children, open, id = useId() }: Props) {
  return (
    <>
      <input id={id} checked={open} type="checkbox" className="modal-toggle" />
      <div className="modal">
        {children}
        <label className="modal-backdrop" htmlFor={id}>Close</label>
      </div>
      <script
        type="module"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: useScript(script, id) }}
      />
    </>
  );
}
export default Modal;
