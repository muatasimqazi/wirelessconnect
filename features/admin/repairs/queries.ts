/**
 * Admin repair query functions.
 * Uses admin client — returns all repair records.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface AdminRepairListItem {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  device_brand: string | null;
  device_model: string | null;
  requested_service: string | null;
  status: string;
  estimated_price: number | null;
  appointment_start: string | null;
  created_at: string;
}

export interface AdminRepairUpdate {
  id: string;
  repair_id: string;
  status: string;
  message: string;
  visible_to_customer: boolean;
  created_at: string;
}

export interface AdminRepairDetail extends AdminRepairListItem {
  device_issue: string;
  final_price: number | null;
  appointment_end: string | null;
  internal_notes: string | null;
  customer_notes: string | null;
  updated_at: string;
  updates: AdminRepairUpdate[];
}

export async function getAdminRepairs(opts?: {
  status?: string;
  limit?: number;
}): Promise<AdminRepairListItem[]> {
  const admin = supabaseAdmin();
  let query = admin
    .from("repairs")
    .select(
      "id, customer_name, customer_email, customer_phone, device_brand, device_model, requested_service, status, estimated_price, appointment_start, created_at",
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
    device_brand: r.device_brand,
    device_model: r.device_model,
    requested_service: r.requested_service,
    status: r.status,
    estimated_price: r.estimated_price,
    appointment_start: r.appointment_start,
    created_at: r.created_at,
  }));
}

export async function getAdminRepairById(id: string): Promise<AdminRepairDetail | null> {
  const admin = supabaseAdmin();

  const [{ data: repair }, { data: updates }] = await Promise.all([
    admin.from("repairs").select("*").eq("id", id).maybeSingle(),
    admin
      .from("repair_updates")
      .select("*")
      .eq("repair_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!repair) return null;

  return {
    id: repair.id,
    customer_name: repair.customer_name,
    customer_email: repair.customer_email,
    customer_phone: repair.customer_phone,
    device_brand: repair.device_brand,
    device_model: repair.device_model,
    device_issue: repair.device_issue,
    requested_service: repair.requested_service,
    status: repair.status,
    estimated_price: repair.estimated_price,
    final_price: repair.final_price,
    appointment_start: repair.appointment_start,
    appointment_end: repair.appointment_end,
    internal_notes: repair.internal_notes,
    customer_notes: repair.customer_notes,
    created_at: repair.created_at,
    updated_at: repair.updated_at,
    updates: (updates ?? []).map((u) => ({
      id: u.id,
      repair_id: u.repair_id,
      status: u.status,
      message: u.message,
      visible_to_customer: u.visible_to_customer,
      created_at: u.created_at,
    })),
  };
}
