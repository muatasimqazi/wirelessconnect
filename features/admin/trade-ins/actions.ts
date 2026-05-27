"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/utils/permissions";
import { sendEmail } from "@/lib/email/send";

export interface TradeInActionResult {
  error?: string;
}

const TRADE_IN_STATUSES = [
  "submitted",
  "under_review",
  "offer_sent",
  "accepted",
  "rejected",
  "expired",
  "completed",
] as const;

type TradeInStatus = (typeof TRADE_IN_STATUSES)[number];

export async function updateTradeInStatus(
  id: string,
  status: TradeInStatus,
  adminNotes?: string,
): Promise<TradeInActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (adminNotes !== undefined) updateData.admin_notes = adminNotes;

  const { error } = await admin
    .from("trade_ins")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updateData as any)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/trade-ins");
  revalidatePath(`/admin/trade-ins/${id}`);
  return {};
}

export async function sendTradeInOffer(
  id: string,
  estimatedOffer: number,
  finalOffer: number,
  adminNotes?: string,
): Promise<TradeInActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  // Fetch trade-in for email
  const { data: tradeIn } = await admin
    .from("trade_ins")
    .select("customer_email, customer_name, customer_locale, brand, model")
    .eq("id", id)
    .maybeSingle();

  if (!tradeIn) return { error: "Trade-in not found." };

  const offerExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    status: "offer_sent",
    estimated_offer: estimatedOffer,
    final_offer: finalOffer,
    offer_expires_at: offerExpiresAt,
    updated_at: new Date().toISOString(),
  };
  if (adminNotes !== undefined) updateData.admin_notes = adminNotes;

  const { error } = await admin
    .from("trade_ins")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updateData as any)
    .eq("id", id);

  if (error) return { error: error.message };

  // Send offer email to customer
  const formattedOffer = `$${(finalOffer / 100).toFixed(2)}`;
  const deviceLabel = `${tradeIn.brand} ${tradeIn.model}`;
  await sendEmail({
    to: tradeIn.customer_email,
    subject: `Trade-In Offer: ${deviceLabel} — Wireless Connect`,
    html: `
      <h2>Your Trade-In Offer</h2>
      <p>Hi ${tradeIn.customer_name},</p>
      <p>We've reviewed your trade-in request for your <strong>${deviceLabel}</strong> and we'd like to offer you <strong>${formattedOffer}</strong>.</p>
      <p>This offer is valid for 7 days. Please visit our store at <strong>14723 Aurora Ave N, Shoreline, WA</strong> to complete the trade-in.</p>
      ${adminNotes ? `<p><strong>Notes:</strong> ${adminNotes}</p>` : ""}
      <p>Questions? Reply to this email or call us at (206) 423-2965.</p>
      <p>— Wireless Connect Team</p>
    `,
    replyTo: "officialwirelessconnect@gmail.com",
  });

  revalidatePath("/admin/trade-ins");
  revalidatePath(`/admin/trade-ins/${id}`);
  return {};
}
