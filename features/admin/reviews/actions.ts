"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/utils/permissions";

export interface ReviewActionResult {
  error?: string;
}

export async function approveReview(id: string): Promise<ReviewActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  const { error } = await admin
    .from("reviews")
    .update({
      approved: true,
      updated_at: new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/product/[slug]", "page");
  return {};
}

export async function rejectReview(id: string): Promise<ReviewActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  const { error } = await admin
    .from("reviews")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  return {};
}
