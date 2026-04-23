import { ImageWidget } from "~/types/widgets";
import Image from "~/components/ui/Image";
import type { ReactNode } from "react";
import Icon, { AvailableIcons } from "../../components/ui/Icon";
import Section from "../../components/ui/Section";

export interface Props {
  header: Header;
  links: Links;
  social?: Social[];
  background: Background;
  footer?: Footer;
}

export interface Header {
  /** @description 150px x 150px image recommended */
  logo?: Logo;
  /** @format textarea */
  title?: string;
  /** @format textarea */
  description?: string;
  /**
   * @format color
   * @description color to be used in title and description
   */
  textColor: string;
}

export interface Logo {
  img?: ImageWidget;
  /** @description alternative text */
  alt?: string;
  width?: number;
  height?: number;
  /** @description external link on logo */
  link?: string;
}

export interface Links {
  items?: Link[];
  style: Style;
}

export interface Link {
  /** @description 20px transparent png recommended */
  icon?: AvailableIcons;
  label: string;
  /** @format textarea */
  href: string;
}

export interface Style {
  /**
   * @format color
   * @description color to be used in link's text
   */
  textColor: string;
  gradientColors: Gradient;
}

export interface Gradient {
  /** @description multiple colors will create a gradient effect */
  neutral: Neutral[];
}

export interface Neutral {
  /**  @format color */
  color: string;
}

export interface Social {
  href: string;
  label:
    | "Instagram"
    | "Facebook"
    | "Linkedin"
    | "WhatsApp"
    | "Discord"
    | "Tiktok";
  /** @format color */
  iconColor?: string;
  /** @description width of the SVG line */
  strokeWidth?: number;
}

export interface Background {
  /** @description an image will override any background color */
  image?: ImageWidget;
  /** @format color */
  backgroundColor?: string;
}

export interface Footer {
  url?: string;
  image?: ImageWidget;
  /** @description alternative text */
  alt?: string;
  width?: number;
  height?: number;
  text?: string;
}

function Links(props: Props) {
  const { header, background, links, social } = props;
  const logo = (
    <Image
      decoding="async"
      src={header.logo?.img || ""}
      alt={header.logo?.alt}
      width={header.logo?.width || 171}
      height={header.logo?.height || 60}
    />
  );

  const maybeLink = header?.logo?.link
    ? <a href={header.logo.link} target="_blank">{logo}</a>
    : logo;

  const ColorsNeutralAndHover = {
    color: links.style?.textColor,
    backgroundImage: `linear-gradient(to right, ${
      links.style?.gradientColors.neutral.map((color) => color.color).join(
        ", ",
      )
    })`,
  };

  return (
    <BaseContainer background={background}>
      <header className="flex flex-col justify-center items-center gap-4">
        {header?.logo?.img && (
          <div className="rounded-full p-4">
            {maybeLink}
          </div>
        )}

        {header?.title && (
          <h1
            className="text-5xl font-bold text-center"
            style={{ color: header.textColor }}
          >
            {header?.title}
          </h1>
        )}

        {header?.description && (
          <p
            style={{ color: header.textColor }}
          >
            {header?.description}
          </p>
        )}
      </header>

      <main className="w-full">
        <ul className="flex flex-col justify-center items-center gap-4">
          {links?.items?.map((link) => (
            <li className="w-full">
              <a
                target="_blank"
                href={link.href}
                className="group h-13 px-6 rounded-full flex justify-start items-center font-bold gap-4"
                style={ColorsNeutralAndHover}
              >
                {Boolean(link.icon) && (
                  <Icon
                    size={20}
                    id={link.icon!}
                  />
                )}

                <span className="w-full text-center text-sm">
                  {link.label}
                </span>

                <Icon
                  size={20}
                  id="share"
                  className="opacity-0 group-hover:opacity-100"
                />
              </a>
            </li>
          ))}
        </ul>
      </main>

      <footer className="flex flex-1 flex-col">
        <ul className="flex flex-row gap-4 mb-10 justify-center items-center">
          {social?.map((link) => (
            <li>
              <a
                target="_blank"
                href={link.href}
                title={link.label}
                className="text-white block rounded"
              >
                <Icon
                  size={20}
                  id={link.label as AvailableIcons}
                  strokeWidth={link.strokeWidth || 2}
                  fill={link.iconColor}
                  style={{ color: link.iconColor }}
                />
              </a>
            </li>
          ))}
        </ul>

        {props.footer && (props.footer.image || props.footer.text) && (
          <div className="mt-auto">
            <a
              href={props.footer.url}
              className="text-xs flex flex-row items-center justify-center gap-1"
              target="_blank"
            >
              {props.footer.text && (
                <p
                  style={{ color: header.textColor }}
                >
                  {props.footer.text}
                </p>
              )}
              {props.footer.image && (
                <Image
                  src={props.footer.image || ""}
                  alt={props.footer.alt}
                  width={props.footer.width || 50}
                  height={props.footer.height || 20}
                />
              )}
            </a>
          </div>
        )}
      </footer>
    </BaseContainer>
  );
}

function BaseContainer(props: {
  children?: ReactNode;
  background?: Props["background"];
}) {
  const { image } = props?.background ?? {};
  const baseClasses = "flex justify-center w-full min-h-screen";
  const inlineStyle = image ? { background: `url(${image})` } : undefined;
  const backgroundColors = props?.background?.backgroundColor;
  const containerClasses = `${baseClasses}`;

  return (
    <div
      className={containerClasses}
      style={{
        ...inlineStyle,
        backgroundColor: backgroundColors ? backgroundColors : undefined,
      }}
    >
      <div className="flex flex-col items-center gap-12 p-10 max-w-[640px] w-full">
        {props.children}
      </div>
    </div>
  );
}

export const LoadingFallback = () => <Section.Placeholder height="635px" />;

export default Links;
