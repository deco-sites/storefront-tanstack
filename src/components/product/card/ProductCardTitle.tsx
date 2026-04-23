export interface Props {
  title: string;
}

export default function ProductCardTitle({ title }: Props) {
  return <span className="font-medium">{title}</span>;
}
