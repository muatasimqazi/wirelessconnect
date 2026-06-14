/**
 * Store settings reader.
 *
 * Settings are stored in the `settings` table as JSONB under the key "store".
 * This module provides a typed interface for reading settings server-side.
 *
 * All settings reads use the admin client because the settings table is
 * restricted by RLS (only staff/admin can read).
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

// ─── Type ─────────────────────────────────────────────────────────────────────

export interface StoreSettings {
  /** Days before a device intake can be listed (RCW 19.60 hold period). Default: 3 */
  hold_period_days?: number;
  /** Stripe Tax enabled. Overridden by STRIPE_TAX_ENABLED env var. */
  stripe_tax_enabled?: boolean;
  /** Order subtotal (cents) above which shipping insurance is added. Default: 50000 ($500) */
  shipping_insurance_threshold?: number;
  /** Shipping insurance fee in cents. Default: 499 ($4.99) */
  shipping_insurance_amount?: number;
  /** Store display name */
  store_name?: string;
  /** Store street address */
  store_address?: string;
  /** Store contact phone */
  store_phone?: string;
  /** Store contact email */
  store_email?: string;
  /** Store hours keyed by lowercase day name, value "HH:MM-HH:MM" or "closed" */
  store_hours?: Record<string, string>;
  /** WhatsApp enabled */
  whatsapp_enabled?: boolean;
  /** WhatsApp number */
  whatsapp_number?: string;
  /** Default warranty days when not set on product */
  default_warranty_days?: number;
}

// ─── Reader ───────────────────────────────────────────────────────────────────

const DEFAULTS: Required<StoreSettings> = {
  hold_period_days: 3,
  stripe_tax_enabled: true,
  shipping_insurance_threshold: 50000,
  shipping_insurance_amount: 499,
  store_name: "Wireless Connect",
  store_address: "14723 Aurora Ave N, Shoreline, WA 98133",
  store_phone: "",
  store_email: "",
  store_hours: {
    monday: "10:00-19:00", tuesday: "10:00-19:00", wednesday: "10:00-19:00",
    thursday: "10:00-19:00", friday: "10:00-19:00",
    saturday: "10:00-18:00", sunday: "closed",
  },
  whatsapp_enabled: false,
  whatsapp_number: "",
  default_warranty_days: 30,
};

let _cachedSettings: StoreSettings | null = null;
let _cacheTs = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

export async function getStoreSettings(): Promise<StoreSettings & typeof DEFAULTS> {
  const now = Date.now();
  if (_cachedSettings && now - _cacheTs < CACHE_TTL_MS) {
    return { ...DEFAULTS, ..._cachedSettings };
  }

  try {
    const admin = supabaseAdmin();
    const { data } = await admin
      .from("settings")
      .select("value")
      .eq("key", "store")
      .maybeSingle();

    const raw = (data?.value ?? {}) as StoreSettings;
    _cachedSettings = raw;
    _cacheTs = now;
    return { ...DEFAULTS, ...raw };
  } catch (err) {
    console.warn("[settings] Could not load store settings, using defaults:", err);
    return DEFAULTS;
  }
}

/**
 * Whether Stripe Tax is enabled.
 * ENV var STRIPE_TAX_ENABLED takes precedence over DB setting.
 */
export function isStripeTaxEnabled(settings: StoreSettings): boolean {
  const envVal = process.env.STRIPE_TAX_ENABLED;
  if (envVal !== undefined) return envVal === "true";
  return settings.stripe_tax_enabled ?? true;
}
