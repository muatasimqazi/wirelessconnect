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
