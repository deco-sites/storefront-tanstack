import { useCallback, useId, type ReactNode } from "react";
import { useEscapeKey } from "../../sdk/useEscapeKey";

interface Props {
  open?: boolean;
  children?: ReactNode;
  id?: string;
}

function Modal({ children, open, id }: Props) {
  const fallbackId = useId();
  const toggleId = id ?? fallbackId;

  const closeViaCheckbox = useCallback(() => {
    const input = document.getElementById(toggleId) as HTMLInputElement | null;
    if (input) input.checked = false;
  }, [toggleId]);

  useEscapeKey(closeViaCheckbox);

  return (
    <>
      <input id={toggleId} defaultChecked={open} type="checkbox" className="modal-toggle" />
      <div className="modal">
        {children}
        <label className="modal-backdrop" htmlFor={toggleId}>
          Close
        </label>
      </div>
    </>
  );
}
export default Modal;
