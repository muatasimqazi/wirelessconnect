/**
 * Admin layout — server component.
 *
 * All /admin routes share this layout.
 *
 * Security:
 *  - requireStaff() runs server-side on EVERY admin page render.
 *    It reads the Supabase session from cookies + checks the `profiles` table.
 *    A missing session or non-staff role → redirects to /en (homepage).
 *  - Admin routes do NOT use locale prefix (English-only dashboard).
 *  - The admin Supabase client (service role) is NOT used here — we use the
 *    server client (RLS) so staff users are still subject to RLS policies.
 *    Only specific admin actions use the service-role client.
 *
 * Layout:
 *  - Fixed sidebar (desktop)
 *  - Collapsible drawer (mobile)
 *  - Top bar with current user name + sign-out
 */

import { requireStaff } from "@/lib/utils/permissions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopBar } from "@/components/admin/admin-topbar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Server-side auth guard — redirects to /en if not staff or admin
  const profile = await requireStaff();

  // <html> and <body> are owned by app/layout.tsx (Next.js 15 requirement).
  // Admin-specific background is applied via a wrapper div.
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        {/* Sidebar — desktop */}
        <AdminSidebar profile={profile} />

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminTopBar profile={profile} />

          <main
            id="admin-main"
            className="flex-1 overflow-auto p-4 md:p-6 lg:p-8"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
