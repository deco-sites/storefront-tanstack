/**
 * Section blocks in data mode (/next/rendering): a section block returns a descriptor, the section to
 * render and its props, and the page's view registry (src/views.tsx) renders it.
 *
 * Sections that had a v7 `loader` export keep it: the loader runs here, on the server, with a request
 * for the page being rendered, and its result becomes the props, as v7 did. The saved props are the
 * loader's input, so that's the type the editor form is generated from.
 */
import type { BlockDescriptor } from "../model";
import { pageState } from "../request-state.server";

/** A v7 section's saved props: its loader's input when it has one, else its component's props. */
export type PropsOf<M> = M extends { loader: (props: infer P, ...rest: any[]) => unknown }
  ? P
  : M extends { default: (props: infer P, ...rest: any[]) => unknown }
    ? P
    : Record<string, never>;

type SectionLoader = (props: any, req: Request) => unknown;

export function section<M>(component: string, loader?: SectionLoader) {
  return async (props: PropsOf<M>): Promise<BlockDescriptor> => ({
    component,
    props: (loader ? await loader(props, pageState().request) : props) as Record<string, unknown>,
  });
}
