export interface Font {
  family: string;
  styleSheet?: string;
}

export interface Props {
  colorScheme?: "light" | "dark" | "any";
  fonts?: Font[];
  variables?: Array<{ name: string; value: string }>;
}

export default function SiteTheme({ variables, fonts, colorScheme }: Props) {
  const cssVars = variables?.length
    ? `:root { ${variables.map((v) => `${v.name}: ${v.value};`).join(" ")} }`
    : "";

  const colorSchemeCss = colorScheme && colorScheme !== "any"
    ? `:root { color-scheme: ${colorScheme}; }`
    : "";

  const css = [cssVars, colorSchemeCss].filter(Boolean).join("\n");

  return (
    <>
      {fonts?.map((font) =>
        font.styleSheet ? (
          <link key={font.family} rel="stylesheet" href={font.styleSheet} />
        ) : null
      )}
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
    </>
  );
}

export { type Font as SiteThemeFont };
