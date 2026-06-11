import { supabaseAdmin } from "@/lib/supabase/admin";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: "customer" | "staff" | "admin";
  preferred_locale: string;
  created_at: string;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, full_name, role, preferred_locale, created_at")
    .order("role", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getAdminUsers: ${error.message}`);
  return (data ?? []) as AdminUser[];
}
