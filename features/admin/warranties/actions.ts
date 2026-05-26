"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/utils/permissions";
import { writeAuditLog } from "@/lib/admin/audit";

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
