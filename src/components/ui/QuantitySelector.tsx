import React, { useId, useRef } from "react";
import { clx } from "~/sdk/clx";

function QuantitySelector(
  { id, disabled, ...props }: React.JSX.IntrinsicElements["input"],
) {
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
    <div className="join border rounded w-full">
      <button
        type="button"
        className="btn btn-square btn-ghost no-animation"
        onClick={() => step(-1)}
        disabled={disabled}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <div
        data-tip={`Quantity must be between ${props.min} and ${props.max}`}
        className={clx(
          "flex-grow join-item",
          "flex justify-center items-center",
          "has-[:invalid]:tooltip has-[:invalid]:tooltip-error has-[:invalid]:tooltip-open has-[:invalid]:tooltip-bottom",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          className={clx(
            "input text-center flex-grow [appearance:textfield]",
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
        className="btn btn-square btn-ghost no-animation"
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
