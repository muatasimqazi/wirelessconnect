/**
 * Admin Dashboard — placeholder page.
 *
 * This will be filled with KPI widgets in Sprint 5.
 * Currently shows a welcome message confirming auth is working.
 */

import { requireStaff } from "@/lib/utils/permissions";

export const metadata = { title: "Dashboard — Wireless Connect Admin" };

export default async function AdminDashboardPage() {
  const profile = await requireStaff();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {profile.full_name ?? "Admin"}. Here&apos;s what&apos;s happening.
        </p>
      </div>

      {/* Sprint 5 — KPI widgets go here */}
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
        Dashboard widgets coming in Sprint 5.
      </div>
    </div>
  );
}
