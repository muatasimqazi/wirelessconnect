"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/utils/permissions";
import { revalidatePath } from "next/cache";

export interface UserActionResult {
  error?: string;
}

const VALID_ROLES = ["customer", "staff", "admin"] as const;
type UserRole = (typeof VALID_ROLES)[number];

export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole,
): Promise<UserActionResult> {
  const currentAdmin = await requireAdmin();

  if (!VALID_ROLES.includes(newRole)) {
    return { error: "Invalid role." };
  }

  // Prevent admins from changing their own role (accidental lockout protection)
  if (currentAdmin.id === targetUserId) {
    return { error: "You cannot change your own role." };
  }

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", targetUserId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return {};
}
