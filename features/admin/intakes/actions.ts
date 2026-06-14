"use server";

/**
 * Admin device intake server actions.
 *
 * Key compliance points:
 *  - RCW 19.60: seller ID number MUST be encrypted before storage.
 *    `seller_id_number_encrypted` is NEVER stored as plaintext.
 *  - Hold period: 3 business days minimum before conversion to product
 *    (waivable by admin with documented reason).
 *  - Publishing gates: 15 gates must pass before intake can become a product.
 *  - Audit logs required for conversion and rejection.
 */

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/utils/permissions";
import { writeAuditLog } from "@/lib/admin/audit";
import { encryptSellerIdNumber } from "@/lib/admin/encrypt";

export interface IntakeActionResult {
  error?: string;
  id?: string;
}

// ─── Create intake schema ─────────────────────────────────────────────────────

const createIntakeSchema = z.object({
  // Device
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  storage: z.string().optional(),
  color: z.string().optional(),
  carrier: z.string().optional(),
  condition: z.string().optional(),
  imei: z.string().optional(),
  serial_number: z.string().optional(),
  battery_health: z.coerce.number().min(0).max(100).optional().nullable(),
  battery_cycle_count: z.coerce.number().min(0).optional().nullable(),
  included_accessories: z.string().optional(),
  cosmetic_notes: z.string().optional(),
  defect_disclosure: z.string().optional(),

  // Acquisition
  acquisition_date: z.string(),
  acquisition_payment_method: z.enum(["cash", "check", "zelle", "venmo", "store_credit", "other"]),
  acquisition_source: z.string().optional(),
  cost: z.coerce.number().min(0).optional().nullable(),

  // Pricing (tentative)
  price: z.coerce.number().min(0).optional().nullable(),
  compare_at_price: z.coerce.number().min(0).optional().nullable(),
  warranty_days: z.coerce.number().min(0).int().default(30),

  // Seller identity (RCW 19.60)
  seller_full_name: z.string().min(1, "Seller name is required"),
  seller_phone: z.string().optional(),
  seller_email: z.string().email().optional().or(z.literal("")),
  seller_address: z.string().optional(),
  seller_id_type: z.enum(["drivers_license", "state_id", "passport", "military_id", "other"]),
  seller_id_number: z.string().min(1, "ID number is required"), // plaintext — will be encrypted
  seller_id_state: z.string().optional(),
  seller_id_expiry: z.string().optional(),
  seller_declaration_signed: z.boolean().default(false),
});

export type CreateIntakeInput = z.infer<typeof createIntakeSchema>;

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createIntake(input: CreateIntakeInput): Promise<IntakeActionResult> {
  const profile = await requireStaff();
  const parsed = createIntakeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };

  // Encrypt ID number before storage (RCW 19.60 compliance)
  let seller_id_number_encrypted: string | null = null;
  try {
    seller_id_number_encrypted = encryptSellerIdNumber(parsed.data.seller_id_number);
  } catch {
    return { error: "Encryption service unavailable. Cannot store seller ID securely." };
  }

  const admin = supabaseAdmin();

  // Compute hold_until_date (acquisition_date + hold_period_days)
  const holdPeriodDays = 3; // default; overrideable later
  const holdUntil = new Date(parsed.data.acquisition_date);
  holdUntil.setDate(holdUntil.getDate() + holdPeriodDays);

  const { seller_id_number: _dropped, ...rest } = parsed.data;

  const { data, error } = await admin
    .from("device_intakes")
    .insert({
      ...rest,
      seller_id_number_encrypted,
      seller_email: rest.seller_email || null,
      hold_period_days: holdPeriodDays,
      hold_until_date: holdUntil.toISOString().split("T")[0],
      status: "received",
      testing_status: "not_started",
      imei_verification_status: "not_checked",
      seller_declaration_signed_at: parsed.data.seller_declaration_signed
        ? new Date().toISOString()
        : null,
      created_by: profile.id,
      updated_by: profile.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await writeAuditLog({
    action: "create",
    table_name: "device_intakes",
    record_id: data.id,
    new_values: {
      brand: parsed.data.brand,
      model: parsed.data.model,
      status: "received",
    },
  });

  revalidatePath("/admin/intakes");
  return { id: data.id };
}

// ─── Wholesale batch intake ───────────────────────────────────────────────────

export interface WholesaleSupplier {
  name: string;
  invoice: string;
  date: string;
  paymentMethod: "cash" | "check" | "zelle" | "venmo" | "store_credit" | "other";
  perUnitCost: number; // cents
  notes: string;
}

export interface WholesaleDevice {
  imei: string;
  brand: string;
  model: string;
  storage: string;
  color: string;
  serialNumber: string;
  condition: string;
  imeiVerificationStatus: "not_checked" | "passed" | "failed" | "needs_review";
  isCleanImei: boolean | null;
  notes: string;
  cost: number; // cents — overrides supplier perUnitCost per device
}

export async function createWholesaleBatch(
  supplier: WholesaleSupplier,
  devices: WholesaleDevice[],
): Promise<{ error?: string; count?: number }> {
  const profile = await requireStaff();

  if (!supplier.name.trim()) return { error: "Supplier name is required." };
  if (devices.length === 0) return { error: "Add at least one device." };

  const admin = supabaseAdmin();

  const holdPeriodDays = 3;
  const holdUntil = new Date(supplier.date);
  holdUntil.setDate(holdUntil.getDate() + holdPeriodDays);
  const holdUntilStr = holdUntil.toISOString().split("T")[0];

  const supplierNotes = [
    supplier.invoice ? `Invoice: ${supplier.invoice}` : null,
    supplier.notes || null,
  ].filter(Boolean).join("\n") || null;

  const records = devices.map((device) => ({
    brand: device.brand,
    model: device.model,
    storage: device.storage || null,
    color: device.color || null,
    imei: device.imei || null,
    serial_number: device.serialNumber || null,
    condition: device.condition || null,
    cosmetic_notes: device.notes || null,
    acquisition_source: "wholesale_supplier",
    acquisition_date: supplier.date,
    acquisition_payment_method: supplier.paymentMethod,
    cost: device.cost / 100,
    seller_full_name: supplier.name, // supplier business name
    supplier_notes: supplierNotes,
    imei_verification_status: device.imeiVerificationStatus,
    is_clean_imei: device.isCleanImei,
    status: "received",
    testing_status: "not_started",
    hold_period_days: holdPeriodDays,
    hold_until_date: holdUntilStr,
    seller_declaration_signed: false,
    // Wholesale purchases from licensed businesses are exempt from RCW 19.60
    // individual-seller hold period requirements
    hold_period_waived: true,
    hold_period_waived_reason: "Wholesale purchase from licensed business — hold period not applicable",
    created_by: profile.id,
    updated_by: profile.id,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await admin.from("device_intakes").insert(records as any).select("id");
  if (error) return { error: error.message };

  await writeAuditLog({
    action: "create",
    table_name: "device_intakes",
    record_id: data[0]?.id ?? "batch",
    new_values: { batch_size: devices.length, supplier: supplier.name, acquisition_source: "wholesale_supplier" },
  });

  revalidatePath("/admin/intakes");
  return { count: data.length };
}

// ─── Update status ────────────────────────────────────────────────────────────

const VALID_INTAKE_TRANSITIONS: Partial<Record<string, string[]>> = {
  received: ["testing", "needs_imei_check", "rejected"],
  testing: ["needs_imei_check", "needs_photos", "ready_to_list", "rejected"],
  needs_imei_check: ["testing", "needs_photos", "ready_to_list", "rejected"],
  needs_photos: ["ready_to_list", "rejected"],
  hold_period: ["ready_to_list", "rejected"],
  ready_to_list: ["converted_to_product", "rejected"],
};

export async function updateIntakeStatus(
  intakeId: string,
  newStatus: string,
): Promise<IntakeActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  const { data: intake } = await admin
    .from("device_intakes")
    .select("status, brand, model")
    .eq("id", intakeId)
    .single();

  if (!intake) return { error: "Intake not found." };

  const allowed = VALID_INTAKE_TRANSITIONS[intake.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return { error: `Cannot transition from "${intake.status}" to "${newStatus}".` };
  }

  const updateFields = { status: newStatus, updated_at: new Date().toISOString() };

  const { error } = await admin
    .from("device_intakes")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updateFields as any)
    .eq("id", intakeId);
  if (error) return { error: error.message };

  await writeAuditLog({
    action: "status_change",
    table_name: "device_intakes",
    record_id: intakeId,
    old_values: { status: intake.status },
    new_values: { status: newStatus },
  });

  revalidatePath("/admin/intakes");
  revalidatePath(`/admin/intakes/${intakeId}`);
  return {};
}

// ─── Update testing results ───────────────────────────────────────────────────

const testingSchema = z.object({
  testing_status: z.enum(["not_started", "in_progress", "passed", "failed", "needs_review"]),
  power_on_passed: z.boolean().nullable(),
  touchscreen_passed: z.boolean().nullable(),
  cameras_passed: z.boolean().nullable(),
  speakers_passed: z.boolean().nullable(),
  microphone_passed: z.boolean().nullable(),
  buttons_passed: z.boolean().nullable(),
  charging_port_passed: z.boolean().nullable(),
  cellular_passed: z.boolean().nullable(),
  wifi_passed: z.boolean().nullable(),
  bluetooth_passed: z.boolean().nullable(),
  face_or_touch_id_passed: z.boolean().nullable(),
  wireless_charging_passed: z.boolean().nullable(),
  activation_lock_removed: z.boolean(),
  factory_reset_verified: z.boolean(),
  data_wiped_verified: z.boolean(),
  testing_notes: z.string().optional(),
  functional_notes: z.string().optional(),
});

export type TestingInput = z.infer<typeof testingSchema>;

export async function updateIntakeTesting(
  intakeId: string,
  input: TestingInput,
): Promise<IntakeActionResult> {
  const profile = await requireStaff();
  const parsed = testingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("device_intakes")
    .update({
      ...parsed.data,
      tested_by: profile.id,
      tested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq("id", intakeId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/intakes/${intakeId}`);
  return {};
}

// ─── Update IMEI verification ─────────────────────────────────────────────────

const imeiSchema = z.object({
  imei_verification_status: z.enum(["not_checked", "passed", "failed", "needs_review"]),
  is_clean_imei: z.boolean().nullable(),
  is_blacklisted: z.boolean().nullable(),
  is_financed: z.boolean().nullable(),
  imei_verification_service: z.string().optional(),
  imei_verification_notes: z.string().optional(),
});

export type IMEIVerificationInput = z.infer<typeof imeiSchema>;

export async function updateIMEIVerification(
  intakeId: string,
  input: IMEIVerificationInput,
): Promise<IntakeActionResult> {
  const profile = await requireStaff();
  const parsed = imeiSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("device_intakes")
    .update({
      ...parsed.data,
      imei_verified_by: profile.id,
      imei_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq("id", intakeId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/intakes/${intakeId}`);
  return {};
}

// ─── Convert to product (15 publishing gates) ────────────────────────────────

/**
 * Verifies all 15 publishing gates, then creates a product from an intake.
 *
 * Gates:
 *  1. Status is "ready_to_list"
 *  2. Testing status is "passed"
 *  3. IMEI verification status is "passed" or "not_checked" (non-IMEI device)
 *  4. is_clean_imei is true (if IMEI device)
 *  5. seller_declaration_signed is true
 *  6. Hold period has elapsed (or waived)
 *  7. Price > 0
 *  8. Brand is set
 *  9. Model is set
 * 10. Condition is set
 * 11. Seller full name is set
 * 12. Seller ID encrypted is set
 * 13. activation_lock_removed is true
 * 14. factory_reset_verified is true
 * 15. data_wiped_verified is true
 */
export async function convertIntakeToProduct(intakeId: string): Promise<IntakeActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  const { data: intake } = await admin
    .from("device_intakes")
    .select("*")
    .eq("id", intakeId)
    .single();

  if (!intake) return { error: "Intake not found." };

  // Publishing gate checks
  const now = new Date();

  const gates: { gate: number; pass: boolean; reason: string }[] = [
    { gate: 1, pass: intake.status === "ready_to_list", reason: "Status must be 'Ready to List'" },
    { gate: 2, pass: intake.testing_status === "passed", reason: "Testing must be 'Passed'" },
    {
      gate: 3,
      pass: !intake.imei || ["passed", "not_checked"].includes(intake.imei_verification_status),
      reason: "IMEI verification must pass (or not required)",
    },
    {
      gate: 4,
      pass: !intake.imei || intake.is_clean_imei === true,
      reason: "IMEI must be verified clean",
    },
    { gate: 5, pass: intake.seller_declaration_signed === true, reason: "Seller declaration must be signed" },
    {
      gate: 6,
      pass:
        intake.hold_period_waived === true ||
        (intake.hold_until_date !== null && new Date(intake.hold_until_date) <= now),
      reason: "Hold period must have elapsed (or be waived)",
    },
    { gate: 7, pass: (intake.price ?? 0) > 0, reason: "Price must be set (> 0)" },
    { gate: 8, pass: !!intake.brand, reason: "Brand is required" },
    { gate: 9, pass: !!intake.model, reason: "Model is required" },
    { gate: 10, pass: !!intake.condition, reason: "Condition is required" },
    { gate: 11, pass: !!intake.seller_full_name, reason: "Seller name is required" },
    { gate: 12, pass: !!intake.seller_id_number_encrypted, reason: "Seller ID must be recorded" },
    { gate: 13, pass: intake.activation_lock_removed === true, reason: "Activation lock must be removed" },
    { gate: 14, pass: intake.factory_reset_verified === true, reason: "Factory reset must be verified" },
    { gate: 15, pass: intake.data_wiped_verified === true, reason: "Data wipe must be verified" },
  ];

  const failing = gates.filter((g) => !g.pass);
  if (failing.length > 0) {
    const reasons = failing.map((g) => `Gate ${g.gate}: ${g.reason}`).join("; ");
    return { error: `Publishing gates failed — ${reasons}` };
  }

  // Create the product
  const slug = generateSlug(intake.brand, intake.model, intake.storage);

  const { data: product, error: productError } = await admin
    .from("products")
    .insert({
      title: [intake.brand, intake.model, intake.storage].filter(Boolean).join(" "),
      brand: intake.brand,
      model: intake.model,
      storage: intake.storage,
      color: intake.color,
      carrier: intake.carrier,
      condition: intake.condition,
      battery_health: intake.battery_health,
      battery_cycle_count: intake.battery_cycle_count,
      price: intake.price!,
      compare_at_price: intake.compare_at_price,
      quantity: 1,
      sku: intake.sku,
      imei: intake.imei,
      serial_number: intake.serial_number,
      warranty_days: intake.warranty_days,
      allow_pickup: intake.allow_pickup,
      allow_shipping: intake.allow_shipping,
      is_clean_imei: intake.is_clean_imei ?? false,
      is_tested: intake.testing_status === "passed",
      is_data_wiped: intake.data_wiped_verified,
      includes_charger: false,
      includes_cable: true,
      featured: intake.featured_candidate,
      status: "active",
      category_type: "phone",
      slug,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select("id")
    .single();

  if (productError) return { error: productError.message };

  // Mark intake as converted
  await admin
    .from("device_intakes")
    .update({
      status: "converted_to_product",
      product_id: product.id,
      converted_to_product_at: now.toISOString(),
      updated_at: now.toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq("id", intakeId);

  await writeAuditLog({
    action: "status_change",
    table_name: "device_intakes",
    record_id: intakeId,
    old_values: { status: "ready_to_list" },
    new_values: { status: "converted_to_product", product_id: product.id },
  });

  revalidatePath("/admin/intakes");
  revalidatePath(`/admin/intakes/${intakeId}`);
  revalidatePath("/admin/products");

  return { id: product.id };
}

// ─── Reject intake ────────────────────────────────────────────────────────────

export async function rejectIntake(
  intakeId: string,
  reason: string,
): Promise<IntakeActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  const { error } = await admin
    .from("device_intakes")
    .update({
      status: "rejected",
      rejection_reason: reason,
      rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq("id", intakeId);

  if (error) return { error: error.message };

  await writeAuditLog({
    action: "status_change",
    table_name: "device_intakes",
    record_id: intakeId,
    new_values: { status: "rejected" },
    notes: reason,
  });

  revalidatePath("/admin/intakes");
  revalidatePath(`/admin/intakes/${intakeId}`);
  return {};
}

// ─── Waive hold period ────────────────────────────────────────────────────────

export async function waiveHoldPeriod(
  intakeId: string,
  reason: string,
): Promise<IntakeActionResult> {
  await requireStaff();
  if (!reason.trim()) return { error: "A reason is required to waive the hold period." };

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("device_intakes")
    .update({
      hold_period_waived: true,
      hold_period_waived_reason: reason,
      updated_at: new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq("id", intakeId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/intakes/${intakeId}`);
  return {};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(brand: string, model: string, storage?: string | null): string {
  const parts = [brand, model, storage].filter(Boolean).join(" ");
  return (
    parts
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) +
    "-" +
    Date.now().toString(36)
  );
}
