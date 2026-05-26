/**
 * Admin device intake query functions.
 *
 * All queries use the admin client (service role) so RLS is bypassed.
 * These functions are ONLY used in server-side admin code.
 *
 * Seller ID numbers are stored encrypted; this module returns the encrypted
 * value. Decryption happens in the actions layer (server actions only).
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

export type AdminIntake = Database["public"]["Tables"]["device_intakes"]["Row"];

export interface AdminIntakeListItem {
  id: string;
  brand: string;
  model: string;
  storage: string | null;
  color: string | null;
  condition: string | null;
  status: string;
  testing_status: string;
  imei_verification_status: string;
  seller_full_name: string | null;
  cost: number | null;
  price: number | null;
  acquisition_date: string;
  hold_until_date: string | null;
  created_at: string;
  converted_to_product_at: string | null;
}

export async function getAdminIntakes(opts?: {
  status?: string;
  limit?: number;
}): Promise<AdminIntakeListItem[]> {
  const admin = supabaseAdmin();
  let query = admin
    .from("device_intakes")
    .select(
      `id, brand, model, storage, color, condition, status,
       testing_status, imei_verification_status, seller_full_name,
       cost, price, acquisition_date, hold_until_date,
       created_at, converted_to_product_at`,
    )
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (opts?.status) query = query.eq("status", opts.status as any);

  const { data } = await query;
  return (data ?? []).map((i) => ({
    id: i.id!,
    brand: i.brand ?? "",
    model: i.model ?? "",
    storage: i.storage,
    color: i.color,
    condition: i.condition,
    status: i.status ?? "received",
    testing_status: i.testing_status ?? "not_started",
    imei_verification_status: i.imei_verification_status ?? "not_checked",
    seller_full_name: i.seller_full_name,
    cost: i.cost !== null ? Number(i.cost) : null,
    price: i.price !== null ? Number(i.price) : null,
    acquisition_date: i.acquisition_date,
    hold_until_date: i.hold_until_date,
    created_at: i.created_at!,
    converted_to_product_at: i.converted_to_product_at,
  }));
}

export async function getAdminIntakeById(id: string): Promise<AdminIntake | null> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("device_intakes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}
