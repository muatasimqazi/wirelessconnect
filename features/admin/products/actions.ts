"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/utils/permissions";
import { writeAuditLog } from "@/lib/admin/audit";

// ─── Schema ───────────────────────────────────────────────────────────────────

const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  storage: z.string().optional(),
  color: z.string().optional(),
  carrier: z.string().optional(),
  condition: z.string().optional(),
  battery_health: z.coerce.number().min(0).max(100).optional().nullable(),
  battery_cycle_count: z.coerce.number().min(0).optional().nullable(),
  price: z.coerce.number().min(0),
  compare_at_price: z.coerce.number().min(0).optional().nullable(),
  quantity: z.coerce.number().min(0).int(),
  sku: z.string().optional(),
  warranty_days: z.coerce.number().min(0).int(),
  status: z.enum(["draft", "active", "archived", "sold_out"]),
  featured: z.boolean().default(false),
  allow_pickup: z.boolean().default(true),
  allow_shipping: z.boolean().default(true),
  is_clean_imei: z.boolean().default(false),
  is_tested: z.boolean().default(false),
  is_data_wiped: z.boolean().default(false),
  imei: z.string().optional(),
  serial_number: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  category_type: z.string().default("phone"),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  includes_charger: z.boolean().default(false),
  includes_cable: z.boolean().default(true),
  network_compatibility: z.array(z.string()).default([]),
  supported_bands: z.array(z.string()).default([]),
});

export type ProductInput = z.infer<typeof productSchema>;

export interface ActionResult {
  error?: string;
  id?: string;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createProduct(input: ProductInput): Promise<ActionResult> {
  await requireStaff();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message };

  const admin = supabaseAdmin();
  const slug = generateSlug(parsed.data.title, parsed.data.brand, parsed.data.model);

  const { data, error } = await admin
    .from("products")
    .insert({
      ...parsed.data,
      slug,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await writeAuditLog({
    action: "create",
    table_name: "products",
    record_id: data.id,
    new_values: { title: parsed.data.title, status: parsed.data.status },
  });

  revalidatePath("/admin/products");
  return { id: data.id };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<ActionResult> {
  await requireStaff();

  const admin = supabaseAdmin();
  const { data: old } = await admin
    .from("products")
    .select("status, title")
    .eq("id", id)
    .single();

  const { error } = await admin
    .from("products")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq("id", id);

  if (error) return { error: error.message };

  const isStatusChange = input.status && old && input.status !== old.status;
  await writeAuditLog({
    action: isStatusChange ? "status_change" : "update",
    table_name: "products",
    record_id: id,
    old_values: isStatusChange ? { status: old?.status } : undefined,
    new_values: isStatusChange ? { status: input.status } : { title: input.title },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return {};
}

// ─── Archive ──────────────────────────────────────────────────────────────────

export async function archiveProduct(id: string): Promise<ActionResult> {
  return updateProduct(id, { status: "archived" });
}

// ─── Image management ─────────────────────────────────────────────────────────

export async function addProductImage(
  productId: string,
  imageUrl: string,
  altText?: string,
  isPrimary = false,
): Promise<ActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();

  // If setting as primary, unset existing primary
  if (isPrimary) {
    await admin
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", productId);
  }

  const { data: existing } = await admin
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort = (existing?.sort_order ?? -1) + 1;

  const { error } = await admin.from("product_images").insert({
    product_id: productId,
    image_url: imageUrl,
    alt_text: altText ?? null,
    is_primary: isPrimary,
    sort_order: nextSort,
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/products/${productId}`);
  return {};
}

export async function deleteProductImage(imageId: string, productId: string): Promise<ActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();
  const { error } = await admin.from("product_images").delete().eq("id", imageId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/products/${productId}`);
  return {};
}

export async function setPrimaryProductImage(
  imageId: string,
  productId: string,
): Promise<ActionResult> {
  await requireStaff();
  const admin = supabaseAdmin();
  await admin.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  const { error } = await admin
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/products/${productId}`);
  return {};
}

// ─── Signed upload URL ────────────────────────────────────────────────────────

export async function getProductImageUploadUrl(
  productId: string,
  fileName: string,
): Promise<{ url?: string; path?: string; error?: string }> {
  await requireStaff();
  const admin = supabaseAdmin();
  const path = `products/${productId}/${Date.now()}-${fileName}`;

  const { data, error } = await admin.storage
    .from("product-images")
    .createSignedUploadUrl(path);

  if (error) return { error: error.message };
  return { url: data.signedUrl, path };
}

// ─── Storage image browser ────────────────────────────────────────────────────

export interface StorageImage {
  name: string;
  url: string;
}

/**
 * Lists images from a Supabase Storage prefix (e.g. "phones").
 * Returns filename + public URL for each image found.
 */
export async function listStorageImages(
  prefix = "phones",
): Promise<{ images: StorageImage[]; error?: string }> {
  await requireStaff();
  const admin = supabaseAdmin();

  const { data, error } = await admin.storage
    .from("product-images")
    .list(prefix, { limit: 200, sortBy: { column: "name", order: "asc" } });

  if (error) return { images: [], error: error.message };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const images = (data ?? [])
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
    .map((f) => ({
      name: f.name,
      url: `${supabaseUrl}/storage/v1/object/public/product-images/${prefix}/${f.name}`,
    }));

  return { images };
}

export async function getIntakeImageUploadUrl(
  intakeId: string,
  fileName: string,
): Promise<{ url?: string; path?: string; error?: string }> {
  await requireStaff();
  const admin = supabaseAdmin();
  const path = `intakes/${intakeId}/${Date.now()}-${fileName}`;

  const { data, error } = await admin.storage
    .from("device-intake-images")
    .createSignedUploadUrl(path);

  if (error) return { error: error.message };
  return { url: data.signedUrl, path };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(title: string, brand?: string, model?: string): string {
  const parts = [brand, model, title].filter(Boolean).join(" ");
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
