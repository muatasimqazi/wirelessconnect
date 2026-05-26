/**
 * Admin product query functions.
 * Uses admin client — returns all products including private fields.
 * Staff/admin only. Never call from storefront.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

export type AdminProduct = Database["public"]["Tables"]["products"]["Row"];

export interface AdminProductListItem {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  status: string;
  price: number;
  quantity: number;
  condition: string | null;
  testing_status: string;
  imei_verification_status: string;
  is_clean_imei: boolean;
  featured: boolean;
  created_at: string;
}

export async function getAdminProducts(opts?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminProductListItem[]> {
  const admin = supabaseAdmin();
  let query = admin
    .from("products")
    .select(
      "id, title, brand, model, sku, status, price, quantity, condition, testing_status, imei_verification_status, is_clean_imei, featured, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (opts?.status) query = query.eq("status", opts.status as any);
  if (opts?.offset) query = query.range(opts.offset, (opts.offset ?? 0) + (opts?.limit ?? 100) - 1);

  const { data } = await query;
  return (data ?? []).map((p) => ({
    ...p,
    id: p.id!,
    title: p.title ?? "",
    status: p.status ?? "draft",
    price: Number(p.price ?? 0),
    quantity: p.quantity ?? 0,
    testing_status: p.testing_status ?? "not_started",
    imei_verification_status: p.imei_verification_status ?? "not_checked",
    is_clean_imei: p.is_clean_imei ?? false,
    featured: p.featured ?? false,
  }));
}

export async function getAdminProductById(id: string): Promise<AdminProduct | null> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export async function getProductImages(productId: string) {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("product_images")
    .select("id, image_url, alt_text, is_primary, sort_order")
    .eq("product_id", productId)
    .order("sort_order");
  return data ?? [];
}
