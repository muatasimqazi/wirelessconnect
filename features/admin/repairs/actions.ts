"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/utils/permissions";
import { sendEmail } from "@/lib/email/send";

export interface RepairActionResult {
  error?: string;
}

const REPAIR_STATUSES = [
  "requested",
  "confirmed",
  "received",
  "in_progress",
  "waiting_on_parts",
  "ready_for_pickup",
  "completed",
  "cancelled",
] as const;

type RepairStatus = (typeof REPAIR_STATUSES)[number];

export async function updateRepairStatus(
  id: string,
  status: RepairStatus,
  message: string,
  visibleToCustomer: boolean = true,
  internalNotes?: string,
): Promise<RepairActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  // Fetch repair for email
  const { data: repair } = await admin
    .from("repairs")
    .select("customer_email, customer_name, device_brand, device_model")
    .eq("id", id)
    .maybeSingle();

  if (!repair) return { error: "Repair not found." };

  // Update repair status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (internalNotes !== undefined) updateData.internal_notes = internalNotes;

  const { error: repairError } = await admin
    .from("repairs")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updateData as any)
    .eq("id", id);

  if (repairError) return { error: repairError.message };

  // Add repair update log entry
  const { error: updateError } = await admin.from("repair_updates").insert({
    repair_id: id,
    status,
    message,
    visible_to_customer: visibleToCustomer,
  });

  if (updateError) {
    console.error("[updateRepairStatus] repair_updates insert error:", updateError.message);
  }

  // Send customer email for visible status changes
  const CUSTOMER_EMAIL_STATUSES: RepairStatus[] = [
    "confirmed",
    "in_progress",
    "ready_for_pickup",
    "completed",
    "cancelled",
  ];

  if (visibleToCustomer && CUSTOMER_EMAIL_STATUSES.includes(status)) {
    const deviceLabel = [repair.device_brand, repair.device_model].filter(Boolean).join(" ") || "Your device";
    const statusLabels: Record<string, string> = {
      confirmed: "Confirmed",
      in_progress: "In Progress",
      ready_for_pickup: "Ready for Pickup",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    await sendEmail({
      to: repair.customer_email,
      subject: `Repair Update: ${deviceLabel} is ${statusLabels[status] ?? status} — Wireless Connect`,
      html: `
        <h2>Repair Status Update</h2>
        <p>Hi ${repair.customer_name},</p>
        <p>Your repair for <strong>${deviceLabel}</strong> has been updated to: <strong>${statusLabels[status] ?? status}</strong>.</p>
        <p>${message}</p>
        ${status === "ready_for_pickup" ? "<p><strong>Your device is ready! Please visit us at 14723 Aurora Ave N, Shoreline, WA to pick it up.</strong></p>" : ""}
        <p>Questions? Call us at (206) 423-2965.</p>
        <p>— Wireless Connect Team</p>
      `,
      replyTo: "officialwirelessconnect@gmail.com",
    });
  }

  revalidatePath("/admin/repairs");
  revalidatePath(`/admin/repairs/${id}`);
  return {};
}
