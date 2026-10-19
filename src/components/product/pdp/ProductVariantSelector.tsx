import { useId } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import type { Product } from "@decocms/apps-commerce/types";
import { useVariantPossibilities } from "@decocms/apps-commerce/sdk/useVariantPossibilities";
import { clx } from "~/sdk/clx";
import { relative } from "../../../sdk/url";

export interface VariantSelectorConfig {
  /**
   * @title Show attribute labels
   * @description Show the attribute name (Color, Size) above each swatch row
   * @default true
   */
  showLabels?: boolean;
  /**
   * @title Preload strategy
   * @description When to prefetch sibling variant routes
   * @default "intent"
   */
  preloadStrategy?: "intent" | "viewport" | "render" | false;
}

export interface Props {
  product: Product;
  config?: VariantSelectorConfig;
  /**
   * Switch to a sibling variant in place. When set, clicking a swatch calls it
   * instead of navigating the router, so the page isn't re-loaded/re-mounted.
   */
  onSelect?: (href: string) => void;
}

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

function Swatch({ value, checked }: { value: string; checked: boolean }) {
  const color = SWATCH_COLORS[value];
  const baseRing = clx(
    "ring-2 ring-offset-2 transition-[box-shadow] duration-150",
    checked ? "ring-primary" : "ring-transparent",
  );

  if (color) {
    return (
      <span
        style={{ backgroundColor: color }}
        className={clx(
          "block w-12 h-12 rounded-full border border-[#C9CFCF]",
          baseRing,
        )}
        aria-label={value}
      />
    );
  }

  return (
    <span
      className={clx(
        "btn btn-ghost border-[#C9CFCF] hover:bg-base-200 hover:border-[#C9CFCF] w-12 h-12",
        baseRing,
      )}
    >
      {value}
    </span>
  );
}

const OMIT = new Set(["category", "cluster", "RefId", "descriptionHtml"]);
const specs = (p: Product) =>
  (p.additionalProperty ?? []).filter((a) => a.name && !OMIT.has(a.name));

/** Variant with `attrName = value` that keeps the current product's other attributes. */
function findSibling(variants: Product[], current: Product, attrName: string, value: string) {
  const wanted = new Map(specs(current).map((a) => [a.name, a.value]));
  wanted.set(attrName, value);
  return variants.find((v) => {
    const props = specs(v);
    return [...wanted].every(([n, val]) => {
      const prop = props.find((a) => a.name === n);
      return !prop || prop.value === val;
    }) && props.some((a) => a.name === attrName && a.value === value);
  });
}

export default function ProductVariantSelector({
  product,
  config,
  onSelect,
}: Props) {
  const id = useId();
  const preloadStrategy = config?.preloadStrategy ?? "intent";
  const showLabels = config?.showLabels ?? true;

  const hasVariant = product.isVariantOf?.hasVariant ?? [];
  const possibilities = useVariantPossibilities(hasVariant, product);
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const currentProductPath = relative(product.url);

  const attrNames = Object.keys(possibilities).filter((n) => {
    const lower = n.toLowerCase();
    return lower !== "title" && lower !== "default title";
  });

  if (attrNames.length === 0) return null;

  return (
    <ul className="flex flex-col gap-4">
      {attrNames.map((attrName) => {
        const entries = Object.entries(possibilities[attrName]).filter(
          ([value, link]) => value && link,
        );
        return (
          <li key={attrName} className="flex flex-col gap-2">
            {showLabels ? <span className="text-sm">{attrName}</span> : null}
            <ul className="flex flex-row gap-4">
              {entries.map(([value, link]) => {
                const href = relative(
                  findSibling(hasVariant, product, attrName, value)?.url ?? link,
                );
                const checked = onSelect
                  ? href === currentProductPath
                  : href === currentPath || href === currentProductPath;
                return (
                  <li key={value}>
                    <Link
                      // Runtime-computed variant URL — catch-all route resolves it.
                      to={href as string}
                      preload={onSelect || preloadStrategy === false ? false : preloadStrategy}
                      aria-label={`${attrName}: ${value}`}
                      aria-current={checked ? "page" : undefined}
                      className="block cursor-pointer"
                      activeOptions={{ exact: true }}
                      onClick={(e) => {
                        if (!onSelect || !href) return;
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                        e.preventDefault();
                        onSelect(href);
                      }}
                    >
                      <Swatch value={value} checked={checked} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
