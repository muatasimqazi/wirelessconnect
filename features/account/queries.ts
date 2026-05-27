/**
 * Customer-facing account query functions.
 *
 * All functions use the server Supabase client (RLS-enforced, anon key).
 * Each function returns null / [] for unauthenticated callers.
 */

import { createClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomerProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  preferred_locale: string;
  avatar_url: string | null;
}

export interface CustomerAddress {
  id: string;
  full_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
}

export interface CustomerWarranty {
  id: string;
  product_title: string;
  device_brand: string | null;
  device_model: string | null;
  warranty_days: number;
  starts_at: string;
  expires_at: string;
  active: boolean;
  claim_status: string;
  claim_submitted_at: string | null;
  claim_description: string | null;
  order_id: string | null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, preferred_locale, avatar_url")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("[getCustomerProfile]", error.message);
    return null;
  }
  return data as CustomerProfile;
}

export async function getCustomerAddresses(): Promise<CustomerAddress[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("addresses")
    .select(
      "id, full_name, phone, line1, line2, city, state, postal_code, country, is_default_shipping, is_default_billing",
    )
    .eq("user_id", user.id)
    .order("is_default_shipping", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getCustomerAddresses]", error.message);
    return [];
  }
  return (data ?? []) as CustomerAddress[];
}

export async function getCustomerWarranties(): Promise<CustomerWarranty[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("warranties")
    .select(
      "id, product_title, device_brand, device_model, warranty_days, starts_at, expires_at, active, claim_status, claim_submitted_at, claim_description, order_id",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getCustomerWarranties]", error.message);
    return [];
  }
  return (data ?? []) as CustomerWarranty[];
}
