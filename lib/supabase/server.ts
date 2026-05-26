import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Server-side Supabase client for Server Components and Server Actions.
 *
 * - Uses cookies for authenticated user session context.
 * - Respects RLS — enforces row-level security.
 * - Uses the public anon key (not service role).
 * - Safe to use in Server Components and Server Actions.
 *
 * For trusted admin operations that must bypass RLS, use the admin client
 * (lib/supabase/admin.ts) — only in secure server-side contexts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from Server Components — cookie writes may be ignored,
            // but the middleware handles session refresh so this is expected behavior.
          }
        },
      },
    }
  );
}
