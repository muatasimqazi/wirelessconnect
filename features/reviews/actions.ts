"use server";

/**
 * Product review server actions.
 *
 * Reviews are NOT approved by default — admin must approve before they appear.
 * Rating must be 1–5. Body is optional.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SubmitReviewData {
  product_id: string;
  rating: number;
  title?: string;
  body?: string;
  reviewer_name?: string;
  reviewer_email?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function submitReview(data: SubmitReviewData): Promise<ActionResult> {
  if (data.rating < 1 || data.rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = supabaseAdmin();
  const { error } = await admin.from("reviews").insert({
    product_id: data.product_id,
    user_id: user?.id ?? null,
    rating: data.rating,
    title: data.title?.trim() ?? null,
    body: data.body?.trim() ?? null,
    reviewer_name: data.reviewer_name?.trim() ?? null,
    reviewer_email: data.reviewer_email?.trim() ?? null,
    approved: false, // requires admin approval
  });

  if (error) {
    console.error("[submitReview]", error.message);
    return { success: false, error: "We couldn't submit your review. Please try again." };
  }

  revalidatePath(`/product/[slug]`, "page");
  return { success: true };
}

export interface ReviewSummary {
  productId: string;
  avgRating: number;
  reviewCount: number;
}

/**
 * Batch-fetches avg rating + review count for a list of product IDs.
 * Returns a Map keyed by productId for O(1) lookup in product grids.
 *
 * Uses approved reviews only.
 */
export async function getReviewSummaries(
  productIds: string[],
): Promise<Map<string, ReviewSummary>> {
  if (productIds.length === 0) return new Map();

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("reviews")
    .select("product_id, rating")
    .in("product_id", productIds)
    .eq("approved", true);

  if (error || !data) return new Map();

  // Aggregate client-side (simple, avoids needing a DB function)
  const acc = new Map<string, { sum: number; count: number }>();
  for (const row of data) {
    const pid = row.product_id as string;
    const existing = acc.get(pid) ?? { sum: 0, count: 0 };
    acc.set(pid, { sum: existing.sum + row.rating, count: existing.count + 1 });
  }

  const result = new Map<string, ReviewSummary>();
  for (const [pid, { sum, count }] of acc) {
    result.set(pid, {
      productId: pid,
      avgRating: Math.round((sum / count) * 10) / 10,
      reviewCount: count,
    });
  }
  return result;
}

export async function getApprovedReviews(productId: string): Promise<Array<{
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  reviewer_name: string | null;
  created_at: string;
}>> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("reviews")
    .select("id, rating, title, body, reviewer_name, created_at")
    .eq("product_id", productId)
    .eq("approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getApprovedReviews]", error.message);
    return [];
  }
  return data ?? [];
}
