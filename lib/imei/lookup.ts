/**
 * IMEI lookup utilities.
 *
 * Two-layer approach:
 *  1. Luhn checksum validation (free, local)
 *  2. Two API calls to IMEICheck.com:
 *     a. Device info  (service 13: Model + Color + Storage + FMI) — $0.02
 *     b. Blacklist    (service  5: Blacklist Status GSMA)         — $0.02
 *     Total: ~$0.04 per intake check
 *
 * API endpoint: GET https://alpha.imeicheck.com/api/php-api/create
 *   ?key=API_KEY&service=SERVICE_ID&imei=IMEI
 *
 * Required env vars:
 *  IMEICHECK_API_KEY            — API key from dashboard
 *  IMEICHECK_SERVICE_ID         — Device info service (default: 13)
 *  IMEICHECK_BLACKLIST_SERVICE_ID — Blacklist service (default: 5)
 */

export interface ImeiLookupResult {
  imei: string;
  valid: boolean;
  brand?: string;
  model?: string;
  storage?: string;
  color?: string;
  carrier?: string;
  serialNumber?: string;
  blacklistStatus?: "clean" | "blacklisted" | "unknown";
  simLock?: string;
  fmiOn?: boolean;
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

// GET https://alpha.imeicheck.com/api/php-api/create?key=KEY&service=ID&imei=IMEI
const API_BASE = "https://alpha.imeicheck.com/api/php-api/create";

export async function lookupImei(imei: string): Promise<ImeiLookupResult> {
  const cleaned = imei.replace(/\D/g, "");

  if (!validateImei(cleaned)) {
    return { imei: cleaned, valid: false, error: "Invalid IMEI (checksum failed)." };
  }

  const apiKey = process.env.IMEICHECK_API_KEY;
  // Service 11: IMEI to Brand/Model/Name — universal, all brands ($0.01)
  const deviceServiceId = process.env.IMEICHECK_SERVICE_ID ?? "11";
  // Service 5: Blacklist Status GSMA ($0.02)
  const blacklistServiceId = process.env.IMEICHECK_BLACKLIST_SERVICE_ID ?? "5";
  // Service 13: Model + Color + Storage + FMI — Apple only ($0.02)
  const appleServiceId = process.env.IMEICHECK_APPLE_SERVICE_ID;

  if (!apiKey) {
    return { imei: cleaned, valid: true, error: "IMEICHECK_API_KEY not configured." };
  }

  try {
    // Always run service 11 (device info) + service 5 (blacklist) in parallel.
    // For Apple, also run service 1 (FMI ON/OFF) in the same batch — no extra latency.
    const [deviceRes, blacklistRes, appleRes] = await Promise.all([
      callApi(apiKey, deviceServiceId, cleaned),
      callApi(apiKey, blacklistServiceId, cleaned),
      // Speculatively call FMI service for all devices — it only costs $0.01 if Apple,
      // and returns an empty/error response for non-Apple which we discard at no charge.
      // Skip if no apple service ID configured.
      appleServiceId
        ? callApi(apiKey, appleServiceId, cleaned)
        : Promise.resolve({ props: {} as Record<string, unknown>, error: undefined }),
    ]);

    if (deviceRes.error) return { imei: cleaned, valid: true, error: deviceRes.error };

    const props = deviceRes.props;
    const blProps = blacklistRes.props;

    // blProps fallback: blacklist response often has brand/name for non-Apple devices
    const merged = { ...blProps, ...props };

    // Prefer human-readable name from blacklist (e.g. "Galaxy Note 9") over
    // technical model code (e.g. "SM-N960U") from device service
    const rawModel =
      str(props.model ?? props.deviceModel ?? props.modelName ?? props.name) ??
      str(blProps.name ?? blProps.model);

    const brand = parseBrand(merged, rawModel);
    const isApple = brand?.toLowerCase() === "apple";

    // Only use Apple service result if device is actually Apple
    const appleProps: Record<string, unknown> =
      isApple && !appleRes.error ? appleRes.props : {};

    const allProps = { ...merged, ...appleProps };

    return {
      imei: cleaned,
      valid: true,
      brand,
      model: cleanModelName(rawModel),
      storage: extractStorage(allProps, rawModel),
      color: str(appleProps.colour ?? appleProps.color),
      carrier: str(allProps.carrier ?? allProps.network ?? allProps.simNetwork),
      serialNumber: str(allProps.serial ?? allProps.serialNumber ?? allProps.sn),
      blacklistStatus: parseBlacklist(allProps),
      simLock: parseSimLock(allProps),
      fmiOn: typeof appleProps.fmiOn === "boolean" ? appleProps.fmiOn : undefined,
      rawProperties: { deviceInfo: props, blacklist: blProps, appleInfo: appleProps },
    };
  } catch (err) {
    console.error("[imei/lookup] fetch failed:", err);
    return { imei: cleaned, valid: true, error: "Could not reach IMEI API." };
  }
}

async function callApi(
  apiKey: string,
  serviceId: string,
  imei: string,
): Promise<{ props: Record<string, unknown>; error?: string }> {
  const url = `${API_BASE}?key=${encodeURIComponent(apiKey)}&service=${serviceId}&imei=${imei}`;
  console.log("[imei/lookup] GET", `${API_BASE}?service=${serviceId}&imei=${imei}`);

  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    const text = await res.text();
    console.error("[imei/lookup] API error:", res.status, text);
    return { props: {}, error: `API ${res.status}: ${text}` };
  }

  const json = await res.json();
  console.log(`[imei/lookup] service ${serviceId} response:`, JSON.stringify(json));

  if (json.status === "error") {
    return { props: {}, error: String(json.response ?? json.message ?? "API error") };
  }

  const raw = json.object ?? json.properties ?? json.result ?? json ?? {};
  // Some services return false/null when they don't support the device (e.g. Apple-only
  // service called with a Samsung IMEI returns { object: false })
  const props: Record<string, unknown> =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  return { props };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(val: unknown): string | undefined {
  if (val == null || val === "" || val === "N/A") return undefined;
  return String(val);
}

function parseBrand(props: Record<string, unknown>, rawModel?: string): string | undefined {
  if (props.isAppleDevice === true) return "Apple";
  const explicit = str(props.brand ?? props.deviceBrand ?? props.manufacturer);
  if (explicit) {
    // Normalise "APPLE" → "Apple", "SAMSUNG" → "Samsung"
    const titleCase = explicit.charAt(0).toUpperCase() + explicit.slice(1).toLowerCase();
    const known: Record<string, string> = {
      apple: "Apple", samsung: "Samsung", google: "Google",
      motorola: "Motorola", oneplus: "OnePlus", lg: "LG",
    };
    return known[explicit.toLowerCase()] ?? titleCase;
  }
  // Infer from model name: "Samsung Galaxy S24" → "Samsung"
  if (rawModel) {
    const known = ["Apple", "Samsung", "Google", "Motorola", "OnePlus", "LG", "Sony", "Huawei"];
    for (const b of known) {
      if (rawModel.toLowerCase().includes(b.toLowerCase())) return b;
    }
  }
  return undefined;
}

function cleanModelName(rawModel?: string): string | undefined {
  if (!rawModel) return undefined;
  // "iPhone 16 Pro Max 512GB Natural Titanium A3084 US" → "iPhone 16 Pro Max"
  // Strategy: strip everything from the storage capacity onward
  return rawModel
    .replace(/\s+\d+\s*(GB|TB).*/i, "")  // strip "512GB ..." onwards
    .replace(/\s+[A-Z]\d{4}\b.*/i, "")   // strip model variant codes like "A3084 US"
    .trim() || rawModel;
}

function extractStorage(props: Record<string, unknown>, rawModel?: string): string | undefined {
  // Try explicit storage fields first
  const explicit = str(props.storage ?? props.storageCapacity ?? props.capacity);
  if (explicit) return explicit.replace(/\s*gb/i, "").trim() + "GB";
  // Extract from model string: "512GB" or "512 GB"
  const match = (rawModel ?? "").match(/(\d+)\s*(GB|TB)/i);
  if (match) return `${match[1]}${match[2].toUpperCase()}`;
  return undefined;
}

function parseSimLock(props: Record<string, unknown>): string | undefined {
  const val = props.simlock ?? props.simLock ?? props.sim_lock ?? props.lockStatus;
  if (val === true || val === "true" || val === 1) return "Locked";
  if (val === false || val === "false" || val === 0) return "Unlocked";
  return str(val);
}

function parseBlacklist(props: Record<string, unknown>): "clean" | "blacklisted" | "unknown" {
  // Prefer the USA-specific status field returned by this API
  const usa = str(props.usaBlockStatus);
  if (usa?.toLowerCase() === "clean") return "clean";
  if (usa && usa.toLowerCase() !== "clean") return "blacklisted";
  // Fall back to GSMA flag
  if (props.gsmaBlacklisted === false) return "clean";
  if (props.gsmaBlacklisted === true) return "blacklisted";
  // Generic fields
  const val = props.blacklisted ?? props.blacklist ?? props.blacklistStatus;
  if (val === false || String(val).toLowerCase() === "clean") return "clean";
  if (val === true || String(val).toLowerCase().includes("blacklist")) return "blacklisted";
  return "unknown";
}
