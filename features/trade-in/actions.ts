"use server";

/**
 * Trade-In server actions.
 *
 * IMPORTANT: Online submissions are preliminary estimates only.
 * Final offers require an in-person inspection. This is a legal / UX requirement.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendAdminEmail } from "@/lib/email/send";

export interface TradeInFormData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_locale: string;
  device_type: "phone" | "tablet" | "laptop" | "accessory" | "other";
  brand: string;
  model: string;
  storage?: string;
  carrier?: string;
  condition?: string;
  battery_health?: number;
  customer_description?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function submitTradeIn(data: TradeInFormData): Promise<ActionResult> {
  if (!data.customer_name?.trim() || !data.customer_email?.trim() || !data.brand?.trim() || !data.model?.trim()) {
    return { success: false, error: "Please fill in all required fields." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = supabaseAdmin();
  const { data: tradeIn, error } = await admin
    .from("trade_ins")
    .insert({
      user_id: user?.id ?? null,
      customer_name: data.customer_name.trim(),
      customer_email: data.customer_email.trim().toLowerCase(),
      customer_phone: data.customer_phone?.trim() ?? null,
      customer_locale: data.customer_locale,
      device_type: data.device_type,
      brand: data.brand.trim(),
      model: data.model.trim(),
      storage: data.storage?.trim() ?? null,
      carrier: (data.carrier as "unlocked" | "att" | "verizon" | "tmobile" | "sprint" | "other" | "unknown") ?? "unknown",
      condition: (data.condition as "like_new" | "excellent" | "good" | "fair") ?? null,
      battery_health: data.battery_health ?? null,
      customer_description: data.customer_description?.trim() ?? null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[submitTradeIn]", error.message);
    return { success: false, error: "We couldn't process your submission. Please try again." };
  }

  // Notify admin (non-blocking)
  await sendAdminEmail({
    subject: `New Trade-In Submission — ${data.brand} ${data.model}`,
    html: `
      <h2>New Trade-In Request</h2>
      <p><strong>Customer:</strong> ${data.customer_name} &lt;${data.customer_email}&gt;</p>
      <p><strong>Device:</strong> ${data.brand} ${data.model} ${data.storage ?? ""}</p>
      <p><strong>Condition:</strong> ${data.condition ?? "Not specified"}</p>
      <p><strong>Battery:</strong> ${data.battery_health ? `${data.battery_health}%` : "Not specified"}</p>
      <p><strong>Description:</strong> ${data.customer_description ?? "None"}</p>
    `,
  }).catch((err) => console.error("[submitTradeIn] admin email:", err));

  return { success: true, id: tradeIn.id };
}
