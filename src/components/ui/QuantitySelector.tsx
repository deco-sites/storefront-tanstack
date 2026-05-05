import React, { useId, useRef } from "react";
import { clx } from "~/sdk/clx";

function QuantitySelector({ id, disabled, ...props }: React.JSX.IntrinsicElements["input"]) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const inputRef = useRef<HTMLInputElement>(null);

  const step = (delta: number) => {
    const input = inputRef.current;
    if (!input) return;
    const min = Number(input.min);
    const max = Number(input.max);
    const lo = Number.isFinite(min) ? min : -Infinity;
    const hi = Number.isFinite(max) ? max : Infinity;
    const next = Math.min(Math.max(input.valueAsNumber + delta, lo), hi);
    input.value = `${next}`;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  return (
    <div className="join w-full rounded border">
      <button
        type="button"
        className="no-animation btn btn-square btn-ghost"
        onClick={() => step(-1)}
        disabled={disabled}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <div
        data-tip={`Quantity must be between ${props.min} and ${props.max}`}
        className={clx(
          "join-item flex-grow",
          "flex items-center justify-center",
          "has-[:invalid]:tooltip-open has-[:invalid]:tooltip has-[:invalid]:tooltip-bottom has-[:invalid]:tooltip-error",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          className={clx(
            "input flex-grow [appearance:textfield] text-center",
            "invalid:input-error",
          )}
          disabled={disabled}
          inputMode="numeric"
          type="number"
          {...props}
        />
      </div>
      <button
        type="button"
        className="no-animation btn btn-square btn-ghost"
        onClick={() => step(1)}
        disabled={disabled}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
export default QuantitySelector;
