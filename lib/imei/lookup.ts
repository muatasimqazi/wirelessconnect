/**
 * IMEI lookup utilities.
 *
 * Two-layer approach:
 *  1. Luhn checksum validation (free, local)
 *  2. Device info + blacklist via IMEICheck.com API (paid per-check)
 *
 * API docs: https://imeicheck.com / https://imeicheck.net/promo-api
 *
 * Required env vars:
 *  IMEICHECK_API_KEY   — Bearer token from IMEICheck.com dashboard
 *  IMEICHECK_SERVICE_ID — Service ID for the check type (from dashboard)
 */

export interface ImeiLookupResult {
  imei: string;
  valid: boolean;
  brand?: string;
  model?: string;
  storage?: string;
  carrier?: string;
  blacklistStatus?: "clean" | "blacklisted" | "unknown";
  simLock?: string;
  error?: string;
  /** Raw properties object returned by the API, for display */
  rawProperties?: Record<string, unknown>;
}

// ─── Luhn checksum validation ─────────────────────────────────────────────────

export function validateImei(imei: string): boolean {
  const digits = imei.replace(/\D/g, "");
  if (digits.length !== 15) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = parseInt(digits[i], 10);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

// ─── IMEICheck.com API ────────────────────────────────────────────────────────

const API_BASE = "https://api.imeicheck.net/checks";

export async function lookupImei(imei: string): Promise<ImeiLookupResult> {
  const cleaned = imei.replace(/\D/g, "");

  if (!validateImei(cleaned)) {
    return { imei: cleaned, valid: false, error: "Invalid IMEI (checksum failed)." };
  }

  const apiKey = process.env.IMEICHECK_API_KEY;
  const serviceId = process.env.IMEICHECK_SERVICE_ID;

  if (!apiKey || !serviceId) {
    return {
      imei: cleaned,
      valid: true,
      error: "IMEICHECK_API_KEY or IMEICHECK_SERVICE_ID not configured.",
    };
  }

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deviceId: cleaned, serviceId: Number(serviceId) }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[imei/lookup] API error:", res.status, text);
      return { imei: cleaned, valid: true, error: `API error ${res.status}.` };
    }

    const json = await res.json();
    const props: Record<string, unknown> = json.properties ?? json.result ?? {};

    return {
      imei: cleaned,
      valid: true,
      brand: str(props.brand ?? props.deviceBrand),
      model: str(props.model ?? props.deviceModel ?? props.modelName),
      storage: extractStorage(props),
      carrier: str(props.carrier ?? props.network),
      blacklistStatus: parseBlacklist(props),
      simLock: str(props.simLock ?? props.simlock ?? props.lockStatus),
      rawProperties: props,
    };
  } catch (err) {
    console.error("[imei/lookup] fetch failed:", err);
    return { imei: cleaned, valid: true, error: "Could not reach IMEI API." };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(val: unknown): string | undefined {
  if (val == null || val === "" || val === "N/A") return undefined;
  return String(val);
}

function extractStorage(props: Record<string, unknown>): string | undefined {
  const raw = str(props.storage ?? props.storageCapacity ?? props.capacity);
  if (!raw) return undefined;
  // Normalise "256" → "256GB", "256 GB" → "256GB"
  return raw.replace(/\s*gb/i, "") + "GB";
}

function parseBlacklist(props: Record<string, unknown>): "clean" | "blacklisted" | "unknown" {
  const val = props.blacklisted ?? props.blacklist ?? props.blacklistStatus;
  if (val === false || String(val).toLowerCase() === "clean") return "clean";
  if (val === true || String(val).toLowerCase().includes("blacklist")) return "blacklisted";
  return "unknown";
}
