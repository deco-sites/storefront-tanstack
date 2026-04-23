// "Powered by deco.cx" footer badge — simple link + logo. Kept as a small
// local component instead of depending on a framework-shipped one so the site
// owns its footer branding.
export default function PoweredByDeco() {
  return (
    <a
      href="https://deco.cx?utm_source=storefront-tanstack"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Powered by deco.cx"
      className="inline-flex items-center gap-2 text-sm text-base-400 hover:text-base-600 transition-colors"
    >
      <span>Powered by</span>
      <span className="font-semibold">deco.cx</span>
    </a>
  );
}
