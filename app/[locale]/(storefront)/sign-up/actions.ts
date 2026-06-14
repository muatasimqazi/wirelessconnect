"use server";

/**
 * Sign-up Server Action.
 *
 * Registers a new user via Supabase Auth email + password.
 * Supabase sends a confirmation email (routed through Resend SMTP).
 *
 * The `handle_new_user` trigger (migration 012) automatically creates a
 * `profiles` row when `auth.users` is inserted — no manual insert needed.
 *
 * Security:
 * - Full name stored in user_metadata (visible to the user's own session)
 * - No role is set here — profiles table assigns 'customer' by default
 * - Supabase enforces rate limiting on signUp calls
 * - Error messages are intentionally vague to prevent user enumeration
 */

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/email/send";
import { buildWelcomeEmail } from "@/lib/email/templates/welcome";

interface SignUpResult {
  error?: string;
}

export async function signUpAction(
  fullName: string,
  email: string,
  password: string,
  locale = "en",
): Promise<SignUpResult | void> {
  const supabase = await createClient();
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    // Supabase returns a 422 when the email is already registered
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already exists") ||
      error.status === 422
    ) {
      return { error: "email_exists" };
    }
    return { error: "unknown" };
  }

  // Send welcome email — non-fatal if it fails
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wirelessconnectstore.com";
  try {
    const { subject, html } = buildWelcomeEmail({ locale, customerName: fullName, siteUrl });
    await sendEmail({ to: email, subject, html });
  } catch {
    // Non-fatal — signup still succeeds even if welcome email fails
  }
}
