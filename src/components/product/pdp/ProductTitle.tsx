import { clx } from "~/sdk/clx";

export interface Props {
  /** The product (or variant group) display name. */
  name: string;
  className?: string;
}

export default function ProductTitle({ name, className }: Props) {
  return (
    <h1 className={clx("text-3xl font-semibold pt-4", className)}>
      {name}
    </h1>
  );
}
