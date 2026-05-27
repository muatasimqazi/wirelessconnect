"use server";

/**
 * Customer account server actions.
 *
 * Auth verification uses the server client (anon key + RLS).
 * Mutations use the admin client — user_id is always included as a guard.
 * This matches the pattern in lib/cart/cart-actions.ts.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { buildWarrantyClaimEmail } from "@/lib/email/templates/warranty-claim";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileUpdateData {
  full_name?: string;
  phone?: string;
  preferred_locale?: string;
}

export interface AddressData {
  full_name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function updateProfile(data: ProfileUpdateData): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("profiles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/profile", "page");
  return { success: true };
}

// ─── Addresses ────────────────────────────────────────────────────────────────

export async function createAddress(data: AddressData): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const admin = supabaseAdmin();

  // Unset existing defaults if this will be the new default
  if (data.is_default_shipping) {
    await admin
      .from("addresses")
      .update({ is_default_shipping: false })
      .eq("user_id", userId)
      .eq("is_default_shipping", true);
  }
  if (data.is_default_billing) {
    await admin
      .from("addresses")
      .update({ is_default_billing: false })
      .eq("user_id", userId)
      .eq("is_default_billing", true);
  }

  const { error } = await admin.from("addresses").insert({
    user_id: userId,
    full_name: data.full_name,
    phone: data.phone ?? null,
    line1: data.line1,
    line2: data.line2 ?? null,
    city: data.city,
    state: data.state,
    postal_code: data.postal_code,
    country: data.country ?? "US",
    is_default_shipping: data.is_default_shipping ?? false,
    is_default_billing: data.is_default_billing ?? false,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/addresses", "page");
  return { success: true };
}

export async function updateAddress(
  id: string,
  data: AddressData,
): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const admin = supabaseAdmin();

  if (data.is_default_shipping) {
    await admin
      .from("addresses")
      .update({ is_default_shipping: false })
      .eq("user_id", userId)
      .eq("is_default_shipping", true)
      .neq("id", id);
  }
  if (data.is_default_billing) {
    await admin
      .from("addresses")
      .update({ is_default_billing: false })
      .eq("user_id", userId)
      .eq("is_default_billing", true)
      .neq("id", id);
  }

  const { error } = await admin
    .from("addresses")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId); // Ownership guard — not in RLS but enforced here

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/addresses", "page");
  return { success: true };
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId); // Ownership guard

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/addresses", "page");
  return { success: true };
}

// ─── Warranty Claims ──────────────────────────────────────────────────────────

export async function submitWarrantyClaim(
  warrantyId: string,
  description: string,
): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  if (!description.trim() || description.trim().length < 10) {
    return { success: false, error: "Please provide a detailed description (at least 10 characters)." };
  }

  const admin = supabaseAdmin();

  // Verify ownership and eligibility
  const { data: warranty, error: fetchErr } = await admin
    .from("warranties")
    .select("id, user_id, claim_status, active, customer_email, customer_name, customer_locale, product_title, order_id")
    .eq("id", warrantyId)
    .eq("user_id", userId) // IDOR guard
    .maybeSingle();

  if (fetchErr || !warranty) {
    return { success: false, error: "Warranty not found." };
  }
  if (!warranty.active) {
    return { success: false, error: "This warranty has expired." };
  }
  if (warranty.claim_status !== "none") {
    return { success: false, error: "A claim has already been submitted for this warranty." };
  }

  // Get order number for the email
  let orderNumber = "N/A";
  if (warranty.order_id) {
    const { data: order } = await admin
      .from("orders")
      .select("order_number")
      .eq("id", warranty.order_id)
      .maybeSingle();
    if (order?.order_number) orderNumber = order.order_number;
  }

  // Update warranty
  const { error: updateErr } = await admin
    .from("warranties")
    .update({
      claim_status: "submitted",
      claim_submitted_at: new Date().toISOString(),
      claim_description: description.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", warrantyId);

  if (updateErr) return { success: false, error: updateErr.message };

  // Send confirmation email (non-blocking)
  const emailData = buildWarrantyClaimEmail({
    locale: warranty.customer_locale ?? "en",
    customerName: warranty.customer_name ?? "Customer",
    customerEmail: warranty.customer_email,
    orderNumber,
    deviceTitle: warranty.product_title,
    claimStatus: "submitted",
  });

  await sendEmail({
    to: warranty.customer_email,
    subject: emailData.subject,
    html: emailData.html,
  }).catch((err) => console.error("[submitWarrantyClaim] email error:", err));

  revalidatePath("/account/warranty", "page");
  return { success: true };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: error.message };
  return { success: true };
}
