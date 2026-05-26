"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/utils/permissions";
import { writeAuditLog } from "@/lib/admin/audit";

export interface CouponActionResult {
  error?: string;
  id?: string;
}

// ─── Create coupon ────────────────────────────────────────────────────────────

const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(30, "Code too long")
    .transform((c) => c.toUpperCase().trim()),
  type: z.enum(["percentage", "fixed_amount", "free_shipping"]),
  value: z.coerce.number().min(0),
  minimum_order_amount: z.coerce.number().min(0).optional().nullable(),
  usage_limit: z.coerce.number().min(1).int().optional().nullable(),
  starts_at: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export type CouponInput = z.infer<typeof couponSchema>;

export async function createCoupon(input: CouponInput): Promise<CouponActionResult> {
  await requireStaff();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };

  // Validate: percentage must be 1–100
  if (parsed.data.type === "percentage" && (parsed.data.value < 1 || parsed.data.value > 100)) {
    return { error: "Percentage discount must be between 1 and 100." };
  }

  const admin = supabaseAdmin();

  // Check for duplicate code
  const { data: existing } = await admin
    .from("coupons")
    .select("id")
    .eq("code", parsed.data.code)
    .maybeSingle();
  if (existing) return { error: `Coupon code "${parsed.data.code}" already exists.` };

  const { data, error } = await admin
    .from("coupons")
    .insert({
      code: parsed.data.code,
      type: parsed.data.type,
      value: parsed.data.value,
      minimum_order_amount: parsed.data.minimum_order_amount ?? null,
      usage_limit: parsed.data.usage_limit ?? null,
      starts_at: parsed.data.starts_at ?? null,
      expires_at: parsed.data.expires_at ?? null,
      active: parsed.data.active,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await writeAuditLog({
    action: "create",
    table_name: "coupons",
    record_id: data.id,
    new_values: { code: parsed.data.code, type: parsed.data.type, value: parsed.data.value },
  });

  revalidatePath("/admin/coupons");
  return { id: data.id };
}

// ─── Disable coupon ───────────────────────────────────────────────────────────

export async function disableCoupon(id: string): Promise<CouponActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  const { error } = await admin
    .from("coupons")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: "update",
    table_name: "coupons",
    record_id: id,
    new_values: { active: false },
  });

  revalidatePath("/admin/coupons");
  return {};
}

// ─── Enable coupon ────────────────────────────────────────────────────────────

export async function enableCoupon(id: string): Promise<CouponActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  const { error } = await admin
    .from("coupons")
    .update({ active: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/coupons");
  return {};
}
