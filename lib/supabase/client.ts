import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Browser (Client Component) Supabase client.
 *
 * - Uses the public anon key only.
 * - Respects RLS — never bypasses row-level security.
 * - Safe to use in Client Components.
 * - Must NEVER be used with the service role key.
 *
 * Use the server client (lib/supabase/server.ts) in Server Components
 * and Server Actions instead.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
