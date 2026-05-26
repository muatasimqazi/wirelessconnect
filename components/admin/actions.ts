"use server";

/**
 * Admin-level Server Actions.
 *
 * These run server-side and are used by admin UI components.
 * Currently contains the sign-out action used by AdminTopBar.
 */

import { createClient } from "@/lib/supabase/server";

/** Signs out the current user and invalidates their session. */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
