import { type ImageWidget } from "~/types/widgets";
import Image from "~/components/ui/Image";
import PoweredByDeco from "~/components/ui/PoweredByDeco";
import Section from "../../components/ui/Section";

/** @titleBy title */
interface Item {
  title: string;
  href: string;
}

/** @titleBy title */
interface Link extends Item {
  children: Item[];
}

/** @titleBy alt */
interface Social {
  alt?: string;
  href?: string;
  image: ImageWidget;
}

interface Props {
  links?: Link[];
  social?: Social[];
  paymentMethods?: Social[];
  policies?: Item[];
  logo?: ImageWidget;
  trademark?: string;
}

function Footer({
  links = [],
  social = [],
  policies = [],
  paymentMethods = [],
  logo,
  trademark,
}: Props) {
  return (
    <footer
      className="px-5 sm:px-0 mt-5 sm:mt-10"
      style={{ backgroundColor: "#EFF0F0" }}
    >
      <div className="container flex flex-col gap-5 sm:gap-10 py-10">
        <ul className="grid grid-flow-row sm:grid-flow-col gap-6 ">
          {links.map(({ title, href, children }) => (
            <li className="flex flex-col gap-4">
              <a className="text-base font-semibold" href={href}>{title}</a>
              <ul className="flex flex-col gap-2">
                {children.map(({ title, href }) => (
                  <li>
                    <a className="text-sm font-medium text-base-400" href={href}>
                      {title}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-12 justify-between items-start sm:items-center">
          <ul className="flex gap-4">
            {social.map(({ image, href, alt }) => (
              <li>
                <a href={href}>
                  <Image
                    src={image}
                    alt={alt}
                    loading="lazy"
                    width={24}
                    height={24}
                  />
                </a>
              </li>
            ))}
          </ul>
          <ul className="flex flex-wrap gap-2">
            {paymentMethods.map(({ image, alt }) => (
              <li className="h-8 w-10 border border-base-100 rounded flex justify-center items-center">
                <Image
                  src={image}
                  alt={alt}
                  width={20}
                  height={20}
                  loading="lazy"
                />
              </li>
            ))}
          </ul>
        </div>

        <hr className="w-full text-base-400" />

        <div className="grid grid-flow-row sm:grid-flow-col gap-8">
          <ul className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
            {policies.map(({ title, href }) => (
              <li>
                <a className="text-xs font-medium" href={href}>
                  {title}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex flex-nowrap items-center justify-between sm:justify-center gap-4">
            <div>
              <img loading="lazy" src={logo} />
            </div>
            <span className="text-xs font-normal text-base-400">{trademark}</span>
          </div>

          <div className="flex flex-nowrap items-center justify-center gap-4">
            <span className="text-sm font-normal text-base-400">Powered by</span>
            <PoweredByDeco />
          </div>
        </div>
      </div>
    </footer>
  );
}

export const LoadingFallback = () => <Section.Placeholder height="1145px" />;

export default Footer;

export const eager = true;
export const sync = true;
export const layout = true;
