"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/utils/permissions";
import { writeAuditLog } from "@/lib/admin/audit";

export interface SettingsActionResult {
  error?: string;
}

const settingsSchema = z.object({
  hold_period_days: z.coerce.number().min(1).max(30).int(),
  stripe_tax_enabled: z.boolean(),
  shipping_insurance_threshold: z.coerce.number().min(0).int(),
  shipping_insurance_amount: z.coerce.number().min(0).int(),
  store_phone: z.string().optional(),
  store_email: z.string().email().optional().or(z.literal("")),
  whatsapp_number: z.string().optional(),
  default_warranty_days: z.coerce.number().min(0).int(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export async function saveStoreSettings(input: SettingsInput): Promise<SettingsActionResult> {
  await requireStaff();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };

  const admin = supabaseAdmin();

  const { error } = await admin
    .from("settings")
    .upsert(
      {
        key: "store",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: JSON.parse(JSON.stringify(parsed.data)) as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

  if (error) return { error: error.message };

  await writeAuditLog({
    action: "update",
    table_name: "settings",
    record_id: "store",
    new_values: parsed.data as Record<string, unknown>,
  });

  revalidatePath("/admin/settings");
  return {};
}
