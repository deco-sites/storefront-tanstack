// Stub for the legacy Deco `useComponent` / HTMX pattern.
// The HTMX-driven components (Minicart, Wishlist, Searchbar, AddToCart) still
// reference `useComponent` + `ComponentProps` — they'll be ported to React
// state/effects in the commerce wiring phase. For now this keeps the build
// green.
import type { SectionProps } from "~/types/deco";

export type ComponentProps<
  LoaderFunc extends (...args: any[]) => any = any,
  ActionFunc extends (...args: any[]) => any = LoaderFunc,
> = SectionProps<LoaderFunc, ActionFunc>;

export function useComponent<T>(_href: string, _props?: T): Record<string, string> {
  return {};
}
