export interface Props {
  html?: string;
  label?: string;
}

export default function ProductDescription({ html, label = "Description" }: Props) {
  if (!html) return null;
  return (
    <div className="mt-4 text-sm sm:mt-6">
      <details>
        <summary className="cursor-pointer">{label}</summary>
        <div className="mt-2 ml-2" dangerouslySetInnerHTML={{ __html: html }} />
      </details>
    </div>
  );
}
