export interface Props {
  html?: string;
  label?: string;
}

export default function ProductDescription({
  html,
  label = "Description",
}: Props) {
  if (!html) return null;
  return (
    <div className="mt-4 sm:mt-6 text-sm">
      <details>
        <summary className="cursor-pointer">{label}</summary>
        <div
          className="ml-2 mt-2"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </details>
    </div>
  );
}
