/**
 * The view registry (/next/rendering): the section each descriptor's `component` names. Keys are
 * the sections' v7 type names, which .deco/index.ts puts in every descriptor.
 */
import type { ComponentType } from "react";
import * as Animation from "./sections/Animation/Animation";
import * as CategoryBanner from "./sections/Category/CategoryBanner";
import * as CategoryGrid from "./sections/Category/CategoryGrid";
import * as Faq from "./sections/Content/Faq";
import * as Hero from "./sections/Content/Hero";
import * as Intro from "./sections/Content/Intro";
import * as Logos from "./sections/Content/Logos";
import * as Footer from "./sections/Footer/Footer";
import * as Header from "./sections/Header/Header";
import * as Banner from "./sections/Images/Banner";
import * as Carousel from "./sections/Images/Carousel";
import * as ImageGallery from "./sections/Images/ImageGallery";
import * as ShoppableBanner from "./sections/Images/ShoppableBanner";
import * as LinkTree from "./sections/Links/LinkTree";
import * as CampaignTimer from "./sections/Miscellaneous/CampaignTimer";
import * as CookieConsent from "./sections/Miscellaneous/CookieConsent";
import * as Newsletter from "./sections/Newsletter/Newsletter";
import * as ProductDetails from "./sections/Product/ProductDetails";
import * as ProductShelf from "./sections/Product/ProductShelf";
import * as ProductShelfTabbed from "./sections/Product/ProductShelfTabbed";
import * as SearchResult from "./sections/Product/SearchResult";
import * as ShelfWithImage from "./sections/Product/ShelfWithImage";
import * as Wishlist from "./sections/Product/Wishlist";
import * as InstagramPosts from "./sections/Social/InstagramPosts";
import * as WhatsApp from "./sections/Social/WhatsApp";

export interface SectionView {
  default: ComponentType<any>;
}

export const views: Record<string, SectionView> = {
  "site/sections/Animation/Animation.tsx": Animation,
  "site/sections/Category/CategoryBanner.tsx": CategoryBanner,
  "site/sections/Category/CategoryGrid.tsx": CategoryGrid,
  "site/sections/Content/Faq.tsx": Faq,
  "site/sections/Content/Hero.tsx": Hero,
  "site/sections/Content/Intro.tsx": Intro,
  "site/sections/Content/Logos.tsx": Logos,
  "site/sections/Footer/Footer.tsx": Footer,
  "site/sections/Header/Header.tsx": Header,
  "site/sections/Images/Banner.tsx": Banner,
  "site/sections/Images/Carousel.tsx": Carousel,
  "site/sections/Images/ImageGallery.tsx": ImageGallery,
  "site/sections/Images/ShoppableBanner.tsx": ShoppableBanner,
  "site/sections/Links/LinkTree.tsx": LinkTree,
  "site/sections/Miscellaneous/CampaignTimer.tsx": CampaignTimer,
  "site/sections/Miscellaneous/CookieConsent.tsx": CookieConsent,
  "site/sections/Newsletter/Newsletter.tsx": Newsletter,
  "site/sections/Product/ProductDetails.tsx": ProductDetails,
  "site/sections/Product/ProductShelf.tsx": ProductShelf,
  "site/sections/Product/ProductShelfTabbed.tsx": ProductShelfTabbed,
  "site/sections/Product/SearchResult.tsx": SearchResult,
  "site/sections/Product/ShelfWithImage.tsx": ShelfWithImage,
  "site/sections/Product/Wishlist.tsx": Wishlist,
  "site/sections/Social/InstagramPosts.tsx": InstagramPosts,
  "site/sections/Social/WhatsApp.tsx": WhatsApp,
};
