/**
 * Admin Users — server component.
 *
 * Admin-only: requireAdmin() redirects non-admin staff to homepage.
 * Lists all profiles with inline role management.
 */

import { requireAdmin } from "@/lib/utils/permissions";
import { getAdminUsers } from "@/features/admin/users/queries";
import { UsersClient } from "./users-client";

export const metadata = { title: "Users — Wireless Connect Admin" };

export default async function AdminUsersPage() {
  const profile = await requireAdmin();
  const users = await getAdminUsers();

  return <UsersClient users={users} currentAdminId={profile.id} />;
}
