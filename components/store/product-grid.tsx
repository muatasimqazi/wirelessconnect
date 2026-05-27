/**
 * ProductGrid — server component.
 *
 * Renders the catalog grid of ProductCards, or an EmptyState when no results.
 */

import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/store/empty-state";
import { SearchXIcon } from "lucide-react";
import type { ProductWithImage } from "@/lib/data/products";
import type { Locale } from "@/i18n/routing";

interface ProductGridProps {
  products: ProductWithImage[];
  locale: Locale;
  /** Whether filters are currently active — affects empty state message. */
  hasFilters?: boolean;
  /** Map of productId → { avgRating, reviewCount } — from getReviewSummaries() */
  ratingMap?: Map<string, { avgRating: number; reviewCount: number }>;
}

export function ProductGrid({ products, locale, hasFilters, ratingMap }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={SearchXIcon}
        title={hasFilters ? "No products match your filters" : "No products available"}
        description={
          hasFilters
            ? "Try adjusting or clearing your filters to see more results."
            : "Check back soon — we're always adding new inventory."
        }
        action={
          hasFilters
            ? { label: "Clear all filters", href: "/shop" }
            : undefined
        }
        className="mt-4"
      />
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-label={`${products.length} products`}
    >
      {products.map((product) => {
        const rating = product.id ? ratingMap?.get(product.id) : undefined;
        return (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            avgRating={rating?.avgRating}
            reviewCount={rating?.reviewCount}
          />
        );
      })}
    </div>
  );
}
