import { useId } from "react";
import { clx } from "~/sdk/clx";
import { relative } from "../../../sdk/url";

const SWATCH_COLORS: Record<string, string | undefined> = {
  White: "white",
  Black: "black",
  Gray: "gray",
  Blue: "#99CCFF",
  Green: "#aad1b5",
  Yellow: "#F1E8B0",
  DarkBlue: "#4E6E95",
  LightBlue: "#bedae4",
  DarkGreen: "#446746",
  LightGreen: "#aad1b5",
  DarkYellow: "#c6b343",
  LightYellow: "#F1E8B0",
};

function Ring({ value, checked }: { value: string; checked: boolean }) {
  const color = SWATCH_COLORS[value];
  const base = clx(
    "ring-2 ring-offset-2",
    checked ? "ring-primary" : "ring-transparent",
  );
  if (color) {
    return (
      <span
        style={{ backgroundColor: color }}
        className={clx(
          "block w-12 h-12 rounded-full border border-[#C9CFCF]",
          base,
        )}
        aria-label={value}
      />
    );
  }
  return (
    <span
      className={clx(
        "btn btn-ghost border-[#C9CFCF] hover:bg-base-200 hover:border-[#C9CFCF] w-12 h-12",
        base,
      )}
    >
      {value}
    </span>
  );
}

export interface Props {
  attrName: string;
  variants: Array<readonly [value: string, link: string]>;
  selectedHref: string;
  onSelect: (href: string) => void;
}

export default function ProductCardVariants({
  attrName,
  variants,
  selectedHref,
  onSelect,
}: Props) {
  const id = useId();
  return (
    <ul className="flex items-center justify-start gap-2 pt-4 pb-1 pl-1 overflow-x-auto">
      {variants.map(([value, link]) => {
        const href = relative(link) as string;
        const checked = href === selectedHref;
        return (
          <li key={href}>
            <button
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`${attrName}: ${value}`}
              name={`${id}-${attrName}`}
              onClick={() => onSelect(href)}
              onMouseEnter={() => onSelect(href)}
              className="cursor-pointer"
            >
              <Ring value={value} checked={checked} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
