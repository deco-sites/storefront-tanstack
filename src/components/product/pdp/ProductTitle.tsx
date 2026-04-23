import { clx } from "~/sdk/clx";

export interface Props {
  /** The product (or variant group) display name. */
  name: string;
  /**
   * Show a skeleton instead of the title while a variant navigation is pending.
   * The skeleton matches the rendered h1 dimensions so there is no layout shift.
   */
  isLoading?: boolean;
  className?: string;
}

export default function ProductTitle({ name, isLoading, className }: Props) {
  if (isLoading) {
    return <div aria-hidden="true" className="mt-4 h-9 w-2/3 skeleton rounded" />;
  }
  return <h1 className={clx("pt-4 text-3xl font-semibold", className)}>{name}</h1>;
}
