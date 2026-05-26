/**
 * Server-side auth helpers.
 *
 * These functions run exclusively on the server (Server Components, Route
 * Handlers, Server Actions). They depend on the server Supabase client which
 * reads cookies and is subject to RLS.
 *
 * Usage pattern:
 *   const profile = await requireAuth();  // redirects to /en/sign-in if unauthenticated
 *   const profile = await requireStaff(); // redirects to /en if not staff or admin
 *
 * Security notes:
 * - Role is read from `profiles` table (RLS-protected), not from JWT claims.
 *   The DB trigger `prevent_role_self_escalation` blocks client-side role changes.
 * - The `is_admin()` / `is_admin_or_staff()` SQL functions are SECURITY DEFINER
 *   with a locked search_path — consistent with the checks here.
 * - Never pass user-controlled input to these functions.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = Database["public"]["Enums"]["user_role"];

// ─── Low-level helpers ────────────────────────────────────────────────────────

/**
 * Returns the authenticated Supabase user, or null if unauthenticated.
 * Does NOT redirect — use requireAuth() for redirect behavior.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * Returns the full profile row for the authenticated user, or null.
 * Does NOT redirect — use requireAuth() for redirect behavior.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ?? null;
}

/**
 * Returns true if the profile has staff or admin role.
 * Safe to call with a null profile — returns false.
 */
export function isStaffOrAdmin(profile: Profile | null): boolean {
  return profile?.role === "admin" || profile?.role === "staff";
}

/**
 * Returns true if the profile has admin role.
 * Safe to call with a null profile — returns false.
 */
export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === "admin";
}

// ─── Auth guards (redirect on failure) ───────────────────────────────────────

/**
 * Requires an authenticated session.
 * Redirects to /en/sign-in if unauthenticated.
 * Returns the profile on success.
 *
 * @param locale - used to build the redirect URL (default "en")
 */
export async function requireAuth(locale = "en"): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/${locale}/sign-in`);
  }
  return profile;
}

/**
 * Requires staff or admin role.
 * Redirects to /{locale} (homepage) if insufficient permissions.
 * Returns the profile on success.
 *
 * Used by admin dashboard routes.
 *
 * @param locale - used to build the redirect URL (default "en")
 */
export async function requireStaff(locale = "en"): Promise<Profile> {
  const profile = await requireAuth(locale);
  if (!isStaffOrAdmin(profile)) {
    redirect(`/${locale}`);
  }
  return profile;
}

/**
 * Requires admin role.
 * Redirects to /{locale} (homepage) if not admin.
 * Returns the profile on success.
 *
 * Used by admin-only actions (role management, system settings).
 *
 * @param locale - used to build the redirect URL (default "en")
 */
export async function requireAdmin(locale = "en"): Promise<Profile> {
  const profile = await requireAuth(locale);
  if (!isAdmin(profile)) {
    redirect(`/${locale}`);
  }
  return profile;
}
