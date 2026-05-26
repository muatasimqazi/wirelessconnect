"use server";

/**
 * Sign-in Server Action.
 *
 * Authenticates via Supabase email + password.
 * Returns an error object on failure (so the client form can display inline
 * error messages without a page reload), or void on success.
 *
 * Security:
 * - Credentials processed server-side only — never touch the client bundle
 * - Supabase rate-limits failed attempts at the auth layer
 * - Error messages are intentionally vague to prevent user enumeration
 */

import { createClient } from "@/lib/supabase/server";

interface SignInResult {
  error?: string;
}

export async function signInAction(
  email: string,
  password: string,
): Promise<SignInResult | void> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Map Supabase error codes to client-safe identifiers
    // Do not expose raw Supabase errors (they may leak user state)
    if (
      error.message.toLowerCase().includes("invalid") ||
      error.message.toLowerCase().includes("credentials")
    ) {
      return { error: "invalid_credentials" };
    }
    return { error: "unknown" };
  }

  // No return on success — caller redirects
}
