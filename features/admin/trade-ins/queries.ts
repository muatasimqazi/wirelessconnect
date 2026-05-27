/**
 * Admin trade-in query functions.
 * Uses admin client — returns all trade-in records.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface AdminTradeInListItem {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  brand: string;
  model: string;
  device_type: string;
  condition: string | null;
  status: string;
  estimated_offer: number | null;
  final_offer: number | null;
  created_at: string;
}

export interface AdminTradeInDetail extends AdminTradeInListItem {
  storage: string | null;
  carrier: string | null;
  battery_health: number | null;
  imei: string | null;
  customer_description: string | null;
  admin_notes: string | null;
  offer_expires_at: string | null;
  updated_at: string;
}

export async function getAdminTradeIns(opts?: {
  status?: string;
  limit?: number;
}): Promise<AdminTradeInListItem[]> {
  const admin = supabaseAdmin();
  let query = admin
    .from("trade_ins")
    .select(
      "id, customer_name, customer_email, customer_phone, brand, model, device_type, condition, status, estimated_offer, final_offer, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 200);

  if (opts?.status) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq("status", opts.status as any);
  }

  const { data } = await query;
  return (data ?? []).map((r) => ({
    id: r.id,
    customer_name: r.customer_name,
    customer_email: r.customer_email,
    customer_phone: r.customer_phone,
    brand: r.brand,
    model: r.model,
    device_type: r.device_type,
    condition: r.condition,
    status: r.status,
    estimated_offer: r.estimated_offer,
    final_offer: r.final_offer,
    created_at: r.created_at,
  }));
}

export async function getAdminTradeInById(id: string): Promise<AdminTradeInDetail | null> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("trade_ins")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    customer_name: data.customer_name,
    customer_email: data.customer_email,
    customer_phone: data.customer_phone,
    brand: data.brand,
    model: data.model,
    device_type: data.device_type,
    condition: data.condition,
    status: data.status,
    estimated_offer: data.estimated_offer,
    final_offer: data.final_offer,
    storage: data.storage,
    carrier: data.carrier,
    battery_health: data.battery_health,
    imei: data.imei,
    customer_description: data.customer_description,
    admin_notes: data.admin_notes,
    offer_expires_at: data.offer_expires_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}
