/**
 * The v7 matchers saved content still names (/next/matchers-and-variants#write-your-own-matcher).
 * Each reads the request the way the rest of the site does: from the page being rendered.
 */
import { pageState } from "../request-state.server";

/** v7's `website/matchers/device.ts`: true when the visitor's device is one of those checked. */
export function device(props: { mobile?: boolean; tablet?: boolean; desktop?: boolean }): boolean {
  const current = pageState().device;
  return Boolean(props[current]);
}

/** v7's `website/matchers/random.ts`: true for `traffic` (0 to 1) of the requests. */
export function random(props: { traffic: number }): boolean {
  return Math.random() < props.traffic;
}
