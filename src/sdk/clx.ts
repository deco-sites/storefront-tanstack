/** Filter out nullable values, join and minify class names */
export const clx = (...args: (string | null | undefined | false)[]) =>
  args.filter(Boolean).join(" ").replace(/\s\s+/g, " ");

/** Alias for compat — some files import as clsx */
export const clsx = clx;

export default clx;
