/**
 * The shapes shared by the block map (.deco/index.ts), the page loader and the views
 * (see /next/routing#the-example-project and /next/tanstack-start-descriptors).
 */
import type { Block, Route } from "@decocms/blocks";

/**
 * What a section block returns in data mode (/next/rendering): the section to render and its props.
 * `component` is the section's v7 type name, which the page also uses for the wrapper's
 * `id` and `data-manifest-key`, exactly as v7 rendered them.
 */
export type BlockDescriptor = {
  component: string;
  /** The section's props: JSON from content and loader results. Loose, so loader data can carry them to the browser. */
  // biome-ignore lint/suspicious/noExplicitAny: each view types its own props
  props: Record<string, any>;
  /** The section was saved inside v7's Lazy wrapper: it renders the same, with v7's fade-in style. */
  deferred?: boolean;
};

/** The page SEO the site's head builder reads (src/head.ts). Every field is optional. */
export interface PageSeo {
  title?: string;
  description?: string;
  titleTemplate?: string;
  descriptionTemplate?: string;
  image?: string;
  canonical?: string;
  noIndexing?: boolean;
  type?: string;
}

/** A saved page, as `client.list` returns it: `seo` and `sections` are still JSON. */
export interface StoredPage extends Route {
  seo?: PageSeo | Block;
  /** A list of blocks, or one multivariate block that picks a whole list. */
  sections: Block[] | Block;
}

/** What the page block returns: `seo` and every block in `sections` resolved. */
export interface ResolvedPage<T> extends Route {
  seo?: PageSeo;
  sections: T[];
}
