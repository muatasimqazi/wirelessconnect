/**
 * Shop catalog page — /[locale]/shop
 *
 * Server Component. All filtering and sorting is done server-side via
 * searchParams → Supabase query. No client-side fetch needed for initial render.
 *
 * URL filter params:
 *   brand, storage, carrier, condition, min_price, max_price,
 *   pickup (boolean), shipping (boolean), q (search), sort, page
 *
 * Pagination: 24 products per page.
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { getProducts, getAvailableBrands, getAvailableStorageSizes } from "@/lib/data/products";
import { getCategories } from "@/lib/data/categories";
import { getReviewSummaries } from "@/features/reviews/actions";
import { ProductGrid } from "@/components/store/product-grid";
import { ShopFilterBar } from "@/components/store/shop-filter-bar";
import { ShopSort } from "@/components/store/shop-sort";
import { ShopPagination } from "@/components/store/shop-pagination";
import { ProductGridSkeleton } from "@/components/store/loading-skeleton";
import { MobileFilterDrawer } from "@/components/store/mobile-filter-drawer";
import type { Locale } from "@/i18n/routing";
import type { ProductSortOption } from "@/lib/data/products";

const PAGE_SIZE = 24;

interface ShopPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    brand?: string;
    storage?: string;
    carrier?: string;
    condition?: string;
    category?: string;
    min_price?: string;
    max_price?: string;
    pickup?: string;
    shipping?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return {
    title: t("title"),
    description: "Browse certified pre-owned phones, tablets, and laptops — professionally tested with warranty.",
    alternates: {
      languages: {
        en: "https://wirelessconnectstore.com/en/shop",
        es: "https://wirelessconnectstore.com/es/shop",
      },
    },
  };
}

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "shop" });

  // Parse pagination
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  // Parse sort
  const validSorts: ProductSortOption[] = ["featured", "newest", "price_asc", "price_desc", "best_condition"];
  const sort: ProductSortOption = validSorts.includes(sp.sort as ProductSortOption)
    ? (sp.sort as ProductSortOption)
    : "featured";

  // Parse price filters (stored as cents in DB, user inputs dollars)
  const minPrice = sp.min_price ? Math.round(parseFloat(sp.min_price) * 100) : undefined;
  const maxPrice = sp.max_price ? Math.round(parseFloat(sp.max_price) * 100) : undefined;

  // Resolve category filter to ID if slug provided
  let categoryId: string | undefined;
  if (sp.category) {
    const cats = await getCategories();
    categoryId = cats.find((c) => c.slug === sp.category)?.id;
  }

  // Fetch products + filter options in parallel
  const [{ products, total }, brands, storageSizes, categories] = await Promise.all([
    getProducts({
      filters: {
        categoryId,
        brand: sp.brand,
        storage: sp.storage,
        carrier: sp.carrier,
        condition: sp.condition,
        minPrice,
        maxPrice,
        allowPickup: sp.pickup === "true",
        allowShipping: sp.shipping === "true",
        search: sp.q,
      },
      sort,
      limit: PAGE_SIZE,
      offset,
    }),
    getAvailableBrands(),
    getAvailableStorageSizes(),
    getCategories(),
  ]);

  // Batch-fetch review summaries for all returned products (single query, not N+1)
  const productIds = products.map((p) => p.id).filter(Boolean) as string[];
  const ratingMap = await getReviewSummaries(productIds);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = !!(sp.brand || sp.storage || sp.carrier || sp.condition || sp.category || sp.min_price || sp.max_price || sp.pickup || sp.shipping || sp.q);

  // Count active filters for the mobile filter badge
  const activeFilterCount = [sp.brand, sp.storage, sp.carrier, sp.condition, sp.category, sp.min_price, sp.max_price, sp.pickup, sp.shipping, sp.q].filter(Boolean).length;

  const currentFilters = {
    brand: sp.brand,
    storage: sp.storage,
    carrier: sp.carrier,
    condition: sp.condition,
    category: sp.category,
    minPrice: sp.min_price,
    maxPrice: sp.max_price,
    pickup: sp.pickup,
    shipping: sp.shipping,
    q: sp.q,
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Page title + count */}
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total} {total === 1 ? "product" : "products"}
          </p>
        </div>
        <ShopSort currentSort={sort} />
      </div>

      {/* Horizontal filter chips + advanced filters button */}
      <div className="mb-6 space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 overflow-hidden">
            <ShopFilterBar
              categories={categories}
              currentFilters={currentFilters}
              activeFilterCount={activeFilterCount}
              onOpenAdvanced={() => {}}
            />
          </div>
          <MobileFilterDrawer
            brands={brands}
            storageSizes={storageSizes}
            categories={categories}
            currentFilters={currentFilters}
            activeFilterCount={0}
          />
        </div>
      </div>

      <div className="min-w-0">

          {/* Product grid */}
          <Suspense fallback={<ProductGridSkeleton count={PAGE_SIZE} />}>
            <ProductGrid
              products={products}
              locale={locale as Locale}
              hasFilters={hasFilters}
              ratingMap={ratingMap}
            />
          </Suspense>

          {/* Pagination */}
          {totalPages > 1 && (
            <ShopPagination
              page={page}
              totalPages={totalPages}
              className="mt-8"
            />
          )}
        {/* Pagination */}
        {totalPages > 1 && (
          <ShopPagination
            page={page}
            totalPages={totalPages}
            className="mt-8"
          />
        )}
      </div>
    </div>
  );
}
