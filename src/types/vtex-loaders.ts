import type { Product, ProductListingPage } from "@decocms/apps/commerce/types";

export interface ProductListProps {
  page: ProductListingPage | null;
}

export interface ProductDetailsProps {
  page: {
    product: Product;
    seo?: { title?: string; description?: string; canonical?: string };
  } | null;
}

export interface SearchProps {
  query?: string;
  page?: number;
  sort?: string;
  filters?: Record<string, string>;
}
