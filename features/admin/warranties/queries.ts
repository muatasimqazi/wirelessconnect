/**
 * Admin warranty query functions.
 * Uses admin client — returns all warranty records.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

export type AdminWarranty = Database["public"]["Tables"]["warranties"]["Row"];

export interface AdminWarrantyListItem {
  id: string;
  product_title: string;
  customer_email: string;
  customer_name: string | null;
  claim_status: string;
  starts_at: string;
  expires_at: string;
  claim_submitted_at: string | null;
  active: boolean;
}

export async function getAdminWarranties(opts?: {
  claimStatus?: string;
  limit?: number;
}): Promise<AdminWarrantyListItem[]> {
  const admin = supabaseAdmin();
  let query = admin
    .from("warranties")
    .select(
      "id, product_title, customer_email, customer_name, claim_status, starts_at, expires_at, claim_submitted_at, active",
    )
    .order("claim_submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (opts?.claimStatus) query = query.eq("claim_status", opts.claimStatus as any);

  const { data } = await query;
  return (data ?? []).map((w) => ({
    id: w.id!,
    product_title: w.product_title ?? "",
    customer_email: w.customer_email ?? "",
    customer_name: w.customer_name,
    claim_status: w.claim_status ?? "none",
    starts_at: w.starts_at!,
    expires_at: w.expires_at!,
    claim_submitted_at: w.claim_submitted_at,
    active: w.active ?? false,
  }));
}

export async function getAdminWarrantyById(id: string): Promise<AdminWarranty | null> {
  const admin = supabaseAdmin();
  const { data } = await admin.from("warranties").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
