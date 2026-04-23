import SearchResult, { Props as SearchResultProps } from "../search/SearchResult";
import { type SectionProps } from "~/types/deco";
export type Props = SearchResultProps;
function WishlistGallery(props: SectionProps<typeof loader>) {
  const isEmpty = !props.page || props.page.products.length === 0;
  if (isEmpty) {
    return (
      <div className="container mx-4 sm:mx-auto">
        <div className="mx-10 my-20 flex flex-col items-center justify-center gap-4">
          <span className="text-2xl font-medium">Your wishlist is empty</span>
          <span>Log in and add items to your wishlist for later. They will show up here</span>
        </div>
      </div>
    );
  }
  return <SearchResult {...props} />;
}
export const loader = (props: Props, req: Request) => {
  return {
    ...props,
    url: req.url,
  };
};
export default WishlistGallery;
