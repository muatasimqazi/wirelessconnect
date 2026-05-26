"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/utils/permissions";
import { writeAuditLog } from "@/lib/admin/audit";
import { sendEmail } from "@/lib/email/send";
import { buildWarrantyClaimEmail } from "@/lib/email/templates/warranty-claim";

export interface WarrantyActionResult {
  error?: string;
}

// ─── Update claim status ──────────────────────────────────────────────────────

const claimStatuses = ["none", "submitted", "under_review", "approved", "denied", "resolved"] as const;

export async function updateWarrantyClaimStatus(
  warrantyId: string,
  claimStatus: (typeof claimStatuses)[number],
  claimNotes?: string,
): Promise<WarrantyActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  const updateFields: Record<string, unknown> = {
    claim_status: claimStatus,
    updated_at: new Date().toISOString(),
  };

  if (claimNotes !== undefined) updateFields.claim_notes = claimNotes;

  if (claimStatus === "resolved" || claimStatus === "denied") {
    updateFields.claim_resolved_at = new Date().toISOString();
  }

  // Fetch warranty + order info for the email before updating
  const { data: warranty } = await admin
    .from("warranties")
    .select(`
      id,
      order_id,
      orders (
        customer_email,
        customer_name,
        order_number,
        customer_locale
      ),
      order_items (
        title
      )
    `)
    .eq("id", warrantyId)
    .single();

  const { error } = await admin
    .from("warranties")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updateFields as any)
    .eq("id", warrantyId);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: "status_change",
    table_name: "warranties",
    record_id: warrantyId,
    new_values: { claim_status: claimStatus },
    notes: claimNotes,
  });

  // Send customer email for meaningful claim status changes (Sprint 5 DoD)
  const EMAIL_STATUSES: Array<(typeof claimStatuses)[number]> = [
    "submitted", "under_review", "approved", "denied", "resolved",
  ];
  if (EMAIL_STATUSES.includes(claimStatus) && warranty) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = (warranty as any).orders;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = (warranty as any).order_items;
    const customerEmail = order?.customer_email;
    if (customerEmail && claimStatus !== "none") {
      const { subject, html } = buildWarrantyClaimEmail({
        locale: order?.customer_locale ?? "en",
        customerName: order?.customer_name ?? "Customer",
        customerEmail,
        orderNumber: order?.order_number ?? "N/A",
        deviceTitle: item?.title ?? "Your device",
        claimStatus,
        claimNotes,
      });
      await sendEmail({ to: customerEmail, subject, html });
    }
  }

  revalidatePath("/admin/warranties");
  revalidatePath(`/admin/warranties/${warrantyId}`);
  return {};
}

// ─── Update claim notes ───────────────────────────────────────────────────────

const notesSchema = z.object({
  claim_notes: z.string(),
});

export async function updateWarrantyNotes(
  warrantyId: string,
  claimNotes: string,
): Promise<WarrantyActionResult> {
  await requireStaff();
  const parsed = notesSchema.safeParse({ claim_notes: claimNotes });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("warranties")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({
      claim_notes: parsed.data.claim_notes,
      updated_at: new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq("id", warrantyId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/warranties/${warrantyId}`);
  return {};
}
