/**
 * Product data-fetching functions.
 *
 * SECURITY: Always query `public_products` view — never the base `products` table
 * for customer-facing pages. The view excludes IMEI, serial number, cost,
 * acquisition source, and other private fields.
 *
 * All functions use the server Supabase client (cookie session + RLS).
 * These run in Server Components and Route Handlers only.
 */

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type PublicProduct = NonNullable<
  Database["public"]["Views"]["public_products"]["Row"]
>;

/** PublicProduct augmented with the primary image URL from product_images. */
export type ProductWithImage = PublicProduct & { primaryImageUrl: string | null };

export type ProductSortOption =
  | "featured"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "best_condition";

export interface ProductFilters {
  categorySlug?: string;
  categoryId?: string;
  brand?: string;
  storage?: string;
  carrier?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  allowPickup?: boolean;
  allowShipping?: boolean;
  search?: string;
}

export interface GetProductsOptions {
  filters?: ProductFilters;
  sort?: ProductSortOption;
  limit?: number;
  offset?: number;
}

export interface GetProductsResult {
  products: ProductWithImage[];
  total: number;
}

// ─── Condition sort order for "best_condition" sort ───────────────────────────
// like_new > excellent > good > fair
const CONDITION_ORDER: Record<string, number> = {
  like_new:  1,
  excellent: 2,
  good:      3,
  fair:      4,
};

/**
 * Returns active products from the public_products view.
 *
 * Supports filtering by brand, condition, storage, carrier, price range,
 * category, fulfillment method, and full-text search.
 *
 * Sort options: featured, newest, price_asc, price_desc, best_condition.
 *
 * Returns total count for pagination alongside results.
 */
export async function getProducts(
  options: GetProductsOptions = {},
): Promise<GetProductsResult> {
  const { filters = {}, sort = "featured", limit = 24, offset = 0 } = options;
  const supabase = await createClient();

  let query = supabase
    .from("public_products")
    .select("*", { count: "exact" });

  // ── Filters ──────────────────────────────────────────────────────────────

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.brand) {
    query = query.ilike("brand", filters.brand);
  }

  if (filters.storage) {
    query = query.eq("storage", filters.storage);
  }

  if (filters.carrier) {
    query = query.eq("carrier", filters.carrier);
  }

  if (filters.condition) {
    query = query.eq("condition", filters.condition);
  }

  if (filters.minPrice != null) {
    query = query.gte("price", filters.minPrice);
  }

  if (filters.maxPrice != null) {
    query = query.lte("price", filters.maxPrice);
  }

  if (filters.allowPickup) {
    query = query.eq("allow_pickup", true);
  }

  if (filters.allowShipping) {
    query = query.eq("allow_shipping", true);
  }

  if (filters.search) {
    // Full-text search on title, brand, model — ilike for simplicity (no FTS index needed for MVP)
    const term = `%${filters.search}%`;
    query = query.or(`title.ilike.${term},brand.ilike.${term},model.ilike.${term}`);
  }

  // ── Sort ─────────────────────────────────────────────────────────────────

  switch (sort) {
    case "featured":
      query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "best_condition":
      // Postgres doesn't support custom enum ordering directly without a CASE.
      // Fetch and sort client-side — dataset is small enough for MVP.
      query = query.order("created_at", { ascending: false });
      break;
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[getProducts]", error.message);
    return { products: [], total: 0 };
  }

  let products = (data ?? []) as PublicProduct[];

  // Client-side sort for best_condition (see comment above)
  if (sort === "best_condition") {
    products = products.sort((a, b) => {
      const aOrder = CONDITION_ORDER[a.condition ?? ""] ?? 99;
      const bOrder = CONDITION_ORDER[b.condition ?? ""] ?? 99;
      return aOrder - bOrder;
    });
  }

  // Batch-fetch primary images for all returned products (single query, not N+1)
  const productIds = products.map((p) => p.id).filter(Boolean) as string[];
  let imageMap: Record<string, string> = {};

  if (productIds.length > 0) {
    const { data: imgData } = await supabase
      .from("product_images")
      .select("product_id, image_url")
      .in("product_id", productIds)
      .eq("is_primary", true) as unknown as {
        data: Array<{ product_id: string; image_url: string }> | null;
      };

    for (const row of imgData ?? []) {
      if (row.product_id) imageMap[row.product_id] = row.image_url;
    }
  }

  const productsWithImages: ProductWithImage[] = products.map((p) => ({
    ...p,
    primaryImageUrl: (p.id && imageMap[p.id]) ? imageMap[p.id] : null,
  }));

  return { products: productsWithImages, total: count ?? 0 };
}

/**
 * Returns a single product by slug from the public_products view.
 * Returns null if not found or not active.
 */
export async function getProductBySlug(slug: string): Promise<PublicProduct | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("public_products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getProductBySlug]", error.message);
    }
    return null;
  }

  return data as PublicProduct;
}

/**
 * Returns featured products for the homepage grid.
 * Limits to `limit` items (default 8).
 */
export async function getFeaturedProducts(limit = 8): Promise<ProductWithImage[]> {
  const { products } = await getProducts({
    filters: {},
    sort: "featured",
    limit,
  });
  return products;
}

/**
 * Returns distinct brands for the filter sidebar.
 * Sorted alphabetically.
 */
export async function getAvailableBrands(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("public_products")
    .select("brand")
    .not("brand", "is", null);

  if (error || !data) return [];

  const brands = [
    ...new Set(
      (data as Array<{ brand: string | null }>).map((r) => r.brand).filter(Boolean),
    ),
  ] as string[];
  return brands.sort();
}

/**
 * Returns distinct storage sizes for the filter sidebar.
 * Sorted by numeric value (e.g. 64GB < 128GB < 256GB).
 */
export async function getAvailableStorageSizes(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("public_products")
    .select("storage")
    .not("storage", "is", null);

  if (error || !data) return [];

  const sizes = [
    ...new Set(
      (data as Array<{ storage: string | null }>).map((r) => r.storage).filter(Boolean),
    ),
  ] as string[];

  // Sort numerically: "64GB" < "128GB" < "256GB" < "512GB" < "1TB"
  return sizes.sort((a, b) => {
    const parse = (s: string) => {
      const tb = s.match(/(\d+(?:\.\d+)?)\s*tb/i);
      if (tb) return parseFloat(tb[1]) * 1024;
      const gb = s.match(/(\d+(?:\.\d+)?)\s*gb/i);
      if (gb) return parseFloat(gb[1]);
      return 0;
    };
    return parse(a) - parse(b);
  });
}

/**
 * Returns product images from product_images table for a given product ID.
 * Returns [] if no images — cards show a placeholder in that case.
 */
export async function getProductImages(
  productId: string,
): Promise<Array<{ id: string; image_url: string; alt_text: string | null; is_primary: boolean; sort_order: number }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_images")
    .select("id, image_url, alt_text, is_primary, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getProductImages]", error.message);
    return [];
  }

  return data ?? [];
}
