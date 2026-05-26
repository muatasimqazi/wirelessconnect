"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface DataDeletionResult {
  success?: boolean;
  error?: string;
}

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
  full_name: z.string().min(1, "Full name is required.").max(200),
  order_number: z.string().optional(),
  reason: z.string().max(2000).optional(),
  locale: z.string().default("en"),
});

// Rate limit: 3 requests per 24 hours per IP to prevent abuse
let ratelimit: Ratelimit | null = null;
function getRatelimit() {
  if (!ratelimit && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.fixedWindow(3, "24 h"),
      prefix: "wc_ddreq",
    });
  }
  return ratelimit;
}

export async function submitDataDeletionRequest(
  formData: FormData,
): Promise<DataDeletionResult> {
  const raw = {
    email: formData.get("email"),
    full_name: formData.get("full_name"),
    order_number: formData.get("order_number") || undefined,
    reason: formData.get("reason") || undefined,
    locale: formData.get("locale") || "en",
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  // Rate limiting — best-effort (skip if Redis not configured)
  const rl = getRatelimit();
  if (rl) {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";
    const { success } = await rl.limit(`ddreq:${ip}`);
    if (!success) {
      return {
        error:
          parsed.data.locale === "es"
            ? "Ha alcanzado el límite de solicitudes. Inténtelo de nuevo en 24 horas."
            : "You have reached the request limit. Please try again in 24 hours.",
      };
    }
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from("data_deletion_requests").insert({
    email: parsed.data.email,
    full_name: parsed.data.full_name,
    order_number: parsed.data.order_number ?? null,
    reason: parsed.data.reason ?? null,
    customer_locale: parsed.data.locale,
    status: "submitted",
    // response_due_at defaults to now() + interval '45 days' in DB
  });

  if (error) {
    console.error("data_deletion_requests insert error:", error.message);
    return { error: "Unable to submit your request. Please try again or contact us directly." };
  }

  return { success: true };
}
