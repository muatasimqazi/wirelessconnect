/**
 * Category data-fetching functions.
 *
 * All functions use the server Supabase client (cookie session + RLS).
 * These run in Server Components and Route Handlers only.
 *
 * Categories are read from the base `categories` table — all columns are
 * safe for public display (no private fields in categories).
 */

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];

/**
 * Returns all active categories ordered by sort_order.
 * Used by: homepage featured categories, shop filter sidebar, admin nav.
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getCategories]", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Returns a single category by slug.
 * Returns null if not found or inactive.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      // PGRST116 = "not found" — expected, not an error worth logging
      console.error("[getCategoryBySlug]", error.message);
    }
    return null;
  }

  return data;
}
