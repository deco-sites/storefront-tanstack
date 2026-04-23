import React from "react";
import { type JSX } from "react";
import { clx } from "~/sdk/clx";
import { useId } from "react";
import { useScript } from "@decocms/start/sdk/useScript";
const onClick = (delta: number) => {
  // doidera!
  event!.stopPropagation();
  const button = event!.currentTarget as HTMLButtonElement;
  const input = button.parentElement
    ?.querySelector<HTMLInputElement>('input[type="number"]')!;
  const min = Number(input.min) || -Infinity;
  const max = Number(input.max) || Infinity;
  input.value = `${Math.min(Math.max(input.valueAsNumber + delta, min), max)}`;
  input.dispatchEvent(new Event("change", { bubbles: true }));
};
function QuantitySelector(
  { id = useId(), disabled, ...props }: React.JSX.IntrinsicElements["input"],
) {
  return (
    <div className="join border rounded w-full">
      <button
        type="button"
        className="btn btn-square btn-ghost no-animation"
        hx-on:click={useScript(onClick, -1)}
        disabled={disabled}
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
          id={id}
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
        hx-on:click={useScript(onClick, 1)}
        disabled={disabled}
      >
        +
      </button>
    </div>
  );
}
export default QuantitySelector;
