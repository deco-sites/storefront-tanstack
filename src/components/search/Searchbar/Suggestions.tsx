import { Suggestion } from "@decocms/apps/commerce/types";
import type { AppContext } from "../../../apps/site";
import { clx } from "~/sdk/clx";
import { ComponentProps } from "../../../sections/Component";
import ProductCard from "../../product/card/ProductCard";
import Icon from "../../ui/Icon";
import Slider from "../../ui/Slider";
import { ACTION, NAME } from "./Form";
import { type Resolved } from "~/types/deco";
export interface Props {
  /**
   * @title Suggestions Integration
   * @todo: improve this typings ({query: string, count: number}) => Suggestions
   */
  loader: Resolved<Suggestion | null>;
}
export const action = async (props: Props, req: Request, ctx: AppContext) => {
  const {
    loader: { __resolveType, ...loaderProps },
  } = props as unknown as {
    loader: { __resolveType: string } & Record<string, unknown>;
  };
  const form = await req.formData();
  const query = `${form.get(NAME ?? "q")}`;
  const suggestion = (await ctx.invoke(__resolveType, {
    ...loaderProps,
    query,
  })) as Suggestion | null;
  return { suggestion };
};
export const loader = async (props: Props, req: Request, ctx: AppContext) => {
  const {
    loader: { __resolveType, ...loaderProps },
  } = props as unknown as {
    loader: { __resolveType: string } & Record<string, unknown>;
  };
  const query = new URL(req.url).searchParams.get(NAME ?? "q");
  const suggestion = (await ctx.invoke(__resolveType, {
    ...loaderProps,
    query,
  })) as Suggestion | null;
  return { suggestion };
};
function Suggestions({ suggestion }: ComponentProps<typeof loader, typeof action>) {
  const { products, searches = [] } = suggestion ?? {};
  if (!products) return null;
  const hasProducts = Boolean(products.length);
  const hasTerms = Boolean(searches.length);
  return (
    <div className={clx(`overflow-y-scroll`, !hasProducts && !hasTerms && "hidden")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[150px_1fr] sm:grid-rows-1">
        <div className="flex flex-col gap-6">
          <span className="text-xl font-medium" role="heading" aria-level={3}>
            Sugestões
          </span>
          <ul className="flex flex-col gap-6">
            {searches.map(({ term }) => (
              <li>
                {/* TODO @gimenes: use name and action from searchbar form */}
                <a href={`${ACTION}?${NAME}=${term}`} className="flex items-center gap-4">
                  <span>
                    <Icon id="search" />
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: term }} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-6 overflow-x-hidden pt-6 md:pt-0">
          <span className="text-xl font-medium" role="heading" aria-level={3}>
            Produtos sugeridos
          </span>
          <Slider className="carousel">
            {products.map((product, index) => (
              <Slider.Item
                index={index}
                className="carousel-item max-w-50 min-w-50 first:ml-4 last:mr-4"
              >
                <ProductCard product={product} index={index} itemListName="Suggeestions" />
              </Slider.Item>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
}
export default Suggestions;
