import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Admin (service role) Supabase client.
 *
 * ⚠️  SECURITY-CRITICAL: This client BYPASSES Row Level Security.
 *
 * Allowed use cases (server-side only):
 * - Stripe webhook order updates and inventory decrement after payment
 * - Device intake creation and admin operations
 * - IMEI verification and testing workflow updates
 * - Warranty record creation after payment
 * - Admin staff operations
 * - Data deletion request review
 * - Cancellation request review
 * - Audit log writes
 *
 * NEVER:
 * - Import this into Client Components or files that are bundled for the browser.
 * - Expose the service role key to any client-facing code.
 * - Use this for customer-facing reads — use the server client with RLS instead.
 */
function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Admin client cannot be created.");
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        // Service role sessions never persist — they are always server-generated
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Singleton admin client instance.
 * Created lazily to avoid errors during build when env vars may not be present.
 */
let _adminClient: ReturnType<typeof createAdminClient> | null = null;

export function getAdminClient() {
  if (!_adminClient) {
    _adminClient = createAdminClient();
  }
  return _adminClient;
}

// Named export for direct import in trusted server-only modules
export const supabaseAdmin = getAdminClient;
