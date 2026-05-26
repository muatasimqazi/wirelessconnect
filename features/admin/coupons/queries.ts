/**
 * Admin coupon query functions.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

export type AdminCoupon = Database["public"]["Tables"]["coupons"]["Row"];

export async function getAdminCoupons(): Promise<AdminCoupon[]> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map((c) => ({
    ...c,
    id: c.id!,
    value: Number(c.value ?? 0),
    used_count: c.used_count ?? 0,
  }));
}
