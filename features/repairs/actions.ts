"use server";

/**
 * Repair appointment server actions.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendAdminEmail } from "@/lib/email/send";

export interface RepairFormData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_locale: string;
  device_brand?: string;
  device_model?: string;
  device_issue: string;
  requested_service?: string;
  customer_notes?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function submitRepairRequest(data: RepairFormData): Promise<ActionResult> {
  if (!data.customer_name?.trim() || !data.customer_email?.trim() || !data.device_issue?.trim()) {
    return { success: false, error: "Please fill in all required fields." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = supabaseAdmin();
  const { data: repair, error } = await admin
    .from("repairs")
    .insert({
      user_id: user?.id ?? null,
      customer_name: data.customer_name.trim(),
      customer_email: data.customer_email.trim().toLowerCase(),
      customer_phone: data.customer_phone?.trim() ?? null,
      customer_locale: data.customer_locale,
      device_brand: data.device_brand?.trim() ?? null,
      device_model: data.device_model?.trim() ?? null,
      device_issue: data.device_issue.trim(),
      requested_service: data.requested_service?.trim() ?? null,
      customer_notes: data.customer_notes?.trim() ?? null,
      status: "requested",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[submitRepairRequest]", error.message);
    return { success: false, error: "We couldn't process your request. Please try again." };
  }

  // Notify admin
  await sendAdminEmail({
    subject: `New Repair Request — ${data.device_brand ?? "Device"} ${data.device_model ?? ""}`,
    html: `
      <h2>New Repair Request</h2>
      <p><strong>Customer:</strong> ${data.customer_name} &lt;${data.customer_email}&gt;</p>
      <p><strong>Device:</strong> ${[data.device_brand, data.device_model].filter(Boolean).join(" ") || "Not specified"}</p>
      <p><strong>Issue:</strong> ${data.device_issue}</p>
      <p><strong>Service Requested:</strong> ${data.requested_service ?? "Not specified"}</p>
      <p><strong>Notes:</strong> ${data.customer_notes ?? "None"}</p>
    `,
  }).catch((err) => console.error("[submitRepairRequest] admin email:", err));

  return { success: true, id: repair.id };
}
