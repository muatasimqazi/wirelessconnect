/**
 * Admin review query functions.
 * Uses admin client — returns all reviews (including unapproved).
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface AdminReviewListItem {
  id: string;
  product_id: string;
  product_title: string | null;
  product_slug: string | null;
  reviewer_name: string | null;
  reviewer_email: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  approved: boolean;
  created_at: string;
}

export async function getAdminReviews(opts?: {
  approved?: boolean;
  limit?: number;
}): Promise<AdminReviewListItem[]> {
  const admin = supabaseAdmin();
  let query = admin
    .from("reviews")
    .select(
      `id, product_id, rating, title, body, reviewer_name, reviewer_email, approved, created_at,
       products:product_id (title, slug)`,
    )
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 200);

  if (opts?.approved !== undefined) {
    query = query.eq("approved", opts.approved);
  }

  const { data } = await query;
  return (data ?? []).map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = (r as any).products as { title: string | null; slug: string | null } | null;
    return {
      id: r.id,
      product_id: r.product_id,
      product_title: product?.title ?? null,
      product_slug: product?.slug ?? null,
      reviewer_name: r.reviewer_name,
      reviewer_email: r.reviewer_email,
      rating: r.rating,
      title: r.title,
      body: r.body,
      approved: r.approved ?? false,
      created_at: r.created_at,
    };
  });
}
