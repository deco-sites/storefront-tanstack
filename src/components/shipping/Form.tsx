import type { SKU } from "@decocms/apps/vtex/utils/types";
import { useId } from "react";
import { useComponent } from "../../sections/Component";

export interface Props {
  items: SKU[];
}

export default function Form({ items }: Props) {
  const slot = useId();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col">
        <span className="text-[#616B6B] text-sm pt-5 border-t-[1px] border-gray-300">
          Please provide your ZIP code to check the delivery times.
        </span>
      </div>

      <form
        className="relative join"
        hx-target={`#${slot}`}
        hx-swap="innerHTML"
        hx-sync="this:replace"
        hx-post={useComponent("./Results.tsx", {
          items,
        })}
      >
        <input
          type="text"
          className="input input-bordered join-item w-48"
          placeholder="00000000"
          name="postalCode"
          maxLength={8}
          size={8}
        />
        <button type="submit" className="btn join-item no-animation">
          <span className="[.htmx-request_&]:hidden inline">Calculate</span>
          <span className="[.htmx-request_&]:inline hidden loading loading-spinner loading-xs" />
        </button>
      </form>

      {/* Results Slot */}
      <div id={slot} />
    </div>
  );
}
