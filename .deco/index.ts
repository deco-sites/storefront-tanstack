// The block map (/next/blocks#the-block-map). Started by @decocms/blocks-migrate from the v7 site and
// finished by hand. Each block is registered under the v7 name saved content stores, as it is
// (/next/renames-and-migrations#checklist-for-migrating-existing-content: "register them as they
// are"), and under no second name: the site editor lists every key of this map, so a short name
// next to each v7 name showed every section twice in its pickers, where v7's editor showed it once.
// Sections return descriptors (/next/rendering), which src/views.ts maps to components.
import type { Blocks, Lazy, Route } from "@decocms/blocks";
import type { BlockDescriptor, PageSeo } from "../src/model";
import type { Suggestion } from "../src/vendor/commerce/types";
import {
  detailsPageExtensions,
  listingPageExtensions,
  shopifyProductDetailsPage,
  shopifyProductListingPage,
} from "../src/blocks/commerce";
import { device, random } from "../src/blocks/matchers";
import { type PropsOf, section } from "../src/blocks/section";
import { seo, seoDetailsPage, seoListingPage } from "../src/blocks/seo";
import { loader as categoryBannerLoader } from "../src/sections/Category/CategoryBanner";
import { loader as searchResultLoader } from "../src/sections/Product/SearchResult";
import { loader as wishlistLoader } from "../src/sections/Product/Wishlist";
import { loader as instagramPostsLoader } from "../src/sections/Social/InstagramPosts";
import shopifyProductList from "../src/vendor/shopify/loaders/ProductList";
import websiteGoogleFonts from "../src/vendor/website/loaders/fonts/googleFonts";

/** The site's page: the built-in fields, with SEO for the site's head builder and descriptor sections. */
interface StorePage extends Route {
  seo?: PageSeo;
  sections: BlockDescriptor[];
}

const animation = section<typeof import("../src/sections/Animation/Animation")>(
  "site/sections/Animation/Animation.tsx",
);
const categoryBanner = section<typeof import("../src/sections/Category/CategoryBanner")>(
  "site/sections/Category/CategoryBanner.tsx",
  categoryBannerLoader,
);
const categoryGrid = section<typeof import("../src/sections/Category/CategoryGrid")>(
  "site/sections/Category/CategoryGrid.tsx",
);
const faq = section<typeof import("../src/sections/Content/Faq")>("site/sections/Content/Faq.tsx");
const hero = section<typeof import("../src/sections/Content/Hero")>(
  "site/sections/Content/Hero.tsx",
);
const intro = section<typeof import("../src/sections/Content/Intro")>(
  "site/sections/Content/Intro.tsx",
);
const logos = section<typeof import("../src/sections/Content/Logos")>(
  "site/sections/Content/Logos.tsx",
);
const footer = section<typeof import("../src/sections/Footer/Footer")>(
  "site/sections/Footer/Footer.tsx",
);
const header = section<typeof import("../src/sections/Header/Header")>(
  "site/sections/Header/Header.tsx",
);
const banner = section<typeof import("../src/sections/Images/Banner")>(
  "site/sections/Images/Banner.tsx",
);
const carousel = section<typeof import("../src/sections/Images/Carousel")>(
  "site/sections/Images/Carousel.tsx",
);
const imageGallery = section<typeof import("../src/sections/Images/ImageGallery")>(
  "site/sections/Images/ImageGallery.tsx",
);
const shoppableBanner = section<typeof import("../src/sections/Images/ShoppableBanner")>(
  "site/sections/Images/ShoppableBanner.tsx",
);
const linkTree = section<typeof import("../src/sections/Links/LinkTree")>(
  "site/sections/Links/LinkTree.tsx",
);
const campaignTimer = section<typeof import("../src/sections/Miscellaneous/CampaignTimer")>(
  "site/sections/Miscellaneous/CampaignTimer.tsx",
);
const cookieConsent = section<typeof import("../src/sections/Miscellaneous/CookieConsent")>(
  "site/sections/Miscellaneous/CookieConsent.tsx",
);
const newsletter = section<typeof import("../src/sections/Newsletter/Newsletter")>(
  "site/sections/Newsletter/Newsletter.tsx",
);
const productDetails = section<typeof import("../src/sections/Product/ProductDetails")>(
  "site/sections/Product/ProductDetails.tsx",
);
const productShelf = section<typeof import("../src/sections/Product/ProductShelf")>(
  "site/sections/Product/ProductShelf.tsx",
);
const productShelfTabbed = section<typeof import("../src/sections/Product/ProductShelfTabbed")>(
  "site/sections/Product/ProductShelfTabbed.tsx",
);
const searchResult = section<typeof import("../src/sections/Product/SearchResult")>(
  "site/sections/Product/SearchResult.tsx",
  searchResultLoader,
);
const shelfWithImage = section<typeof import("../src/sections/Product/ShelfWithImage")>(
  "site/sections/Product/ShelfWithImage.tsx",
);
const wishlist = section<typeof import("../src/sections/Product/Wishlist")>(
  "site/sections/Product/Wishlist.tsx",
  wishlistLoader,
);
const instagramPosts = section<typeof import("../src/sections/Social/InstagramPosts")>(
  "site/sections/Social/InstagramPosts.tsx",
  instagramPostsLoader,
);
const whatsApp = section<typeof import("../src/sections/Social/WhatsApp")>(
  "site/sections/Social/WhatsApp.tsx",
);

/**
 * The theme section. v7 never rendered it on this site (its Google Fonts loader had no
 * implementation, so the section dropped out of every page), and the pages' colors and fonts come
 * from src/styles/app.css. It stays a block, so saved themes keep their form, and renders nothing,
 * which keeps every page exactly as it looks today. Its font is a lazy argument, so the font loader
 * doesn't run for it. Turning it on means returning a descriptor for it and calling `font()`, and it
 * changes the look of every page.
 */
type ThemeProps = PropsOf<typeof import("../src/sections/Theme/Theme")>;
const theme = (
  _props: Omit<ThemeProps, "font"> & { font?: Lazy<NonNullable<ThemeProps["font"]>> },
): BlockDescriptor | undefined => undefined;

/**
 * v7's Lazy wrapper loaded its section after the page. A block streams on its own here
 * (/next/tanstack-start-descriptors#3-match-the-url-to-a-page), so the wrapper returns its section,
 * marked so the page keeps v7's fade-in.
 */
const lazySection = (props: { section?: BlockDescriptor }): BlockDescriptor | undefined =>
  props.section && { ...props.section, deferred: true };

/** v7's `resolved`: a value saved as is. Only the header's search suggestions use it, saved as `null`. */
const resolved = (props: { data: Suggestion | null }): Suggestion | null => props.data;

export default {
  // The built-in page, replaced so its sections are descriptors and its seo is the site's
  // (/next/built-in-blocks#change-a-built-in). v7's website/pages/Page.tsx is a built-in alias.
  page: (input: StorePage) => input,

  // SEO
  "website/sections/Seo/SeoV2.tsx": seo,
  "commerce/sections/Seo/SeoPLPV2.tsx": seoListingPage,
  "commerce/sections/Seo/SeoPDPV2.tsx": seoDetailsPage,

  // Commerce data, over the Shopify upstream client
  "shopify/loaders/ProductDetailsPage.ts": shopifyProductDetailsPage,
  "shopify/loaders/ProductList.ts": shopifyProductList,
  "shopify/loaders/ProductListingPage.ts": shopifyProductListingPage,
  "commerce/loaders/product/extensions/listingPage.ts": listingPageExtensions,
  "commerce/loaders/product/extensions/detailsPage.ts": detailsPageExtensions,
  "website/loaders/fonts/googleFonts.ts": websiteGoogleFonts,
  resolved,

  // Matchers
  "website/matchers/device.ts": device,
  "website/matchers/random.ts": random,

  // v7's Lazy wrapper
  "website/sections/Rendering/Lazy.tsx": lazySection,

  // Sections
  "site/sections/Animation/Animation.tsx": animation,
  "site/sections/Category/CategoryBanner.tsx": categoryBanner,
  "site/sections/Category/CategoryGrid.tsx": categoryGrid,
  "site/sections/Content/Faq.tsx": faq,
  "site/sections/Content/Hero.tsx": hero,
  "site/sections/Content/Intro.tsx": intro,
  "site/sections/Content/Logos.tsx": logos,
  "site/sections/Footer/Footer.tsx": footer,
  "site/sections/Header/Header.tsx": header,
  "site/sections/Images/Banner.tsx": banner,
  "site/sections/Images/Carousel.tsx": carousel,
  "site/sections/Images/ImageGallery.tsx": imageGallery,
  "site/sections/Images/ShoppableBanner.tsx": shoppableBanner,
  "site/sections/Links/LinkTree.tsx": linkTree,
  "site/sections/Miscellaneous/CampaignTimer.tsx": campaignTimer,
  "site/sections/Miscellaneous/CookieConsent.tsx": cookieConsent,
  "site/sections/Newsletter/Newsletter.tsx": newsletter,
  "site/sections/Product/ProductDetails.tsx": productDetails,
  "site/sections/Product/ProductShelf.tsx": productShelf,
  "site/sections/Product/ProductShelfTabbed.tsx": productShelfTabbed,
  "site/sections/Product/SearchResult.tsx": searchResult,
  "site/sections/Product/ShelfWithImage.tsx": shelfWithImage,
  "site/sections/Product/Wishlist.tsx": wishlist,
  "site/sections/Social/InstagramPosts.tsx": instagramPosts,
  "site/sections/Social/WhatsApp.tsx": whatsApp,
  "site/sections/Theme/Theme.tsx": theme,
} satisfies Blocks;
