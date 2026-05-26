/**
 * AdminSidebar — server component.
 *
 * Desktop navigation sidebar for the admin dashboard.
 * Shows navigation groups: Catalog, Orders, Customers, Intakes,
 * Warranties, Coupons, Settings.
 *
 * Role-gated items (admin-only) are conditionally rendered based on
 * the profile passed from AdminLayout (already validated by requireStaff).
 */

import Link from "next/link";
import {
  LayoutDashboardIcon,
  SmartphoneIcon,
  ShoppingBagIcon,
  UsersIcon,
  ClipboardListIcon,
  ShieldIcon,
  TagIcon,
  SettingsIcon,
  PackageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isAdmin } from "@/lib/utils/permissions";
import type { Profile } from "@/lib/utils/permissions";

interface AdminSidebarProps {
  profile: Profile;
}

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon, exact: true },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: SmartphoneIcon },
      { href: "/admin/categories", label: "Categories", icon: PackageIcon },
      { href: "/admin/intakes", label: "Device Intakes", icon: ClipboardListIcon },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBagIcon },
      { href: "/admin/warranties", label: "Warranties", icon: ShieldIcon },
      { href: "/admin/coupons", label: "Coupons", icon: TagIcon },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/customers", label: "Customers", icon: UsersIcon },
    ],
    adminOnly: false,
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
    ],
    adminOnly: true, // Only admins see settings
  },
];

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const userIsAdmin = isAdmin(profile);

  return (
    <aside
      className="hidden w-60 shrink-0 flex-col border-e border-border bg-background md:flex"
      aria-label="Admin navigation"
    >
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link
          href="/admin"
          className="text-base font-bold text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          WC Admin
        </Link>
        <span className="ms-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          {profile.role}
        </span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Admin navigation links">
        {navGroups.map((group) => {
          // Skip admin-only groups for staff
          if (group.adminOnly && !userIsAdmin) return null;

          return (
            <div key={group.label} className="mb-4">
              <p className="mb-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium",
                    "text-foreground/80 transition-colors",
                    "hover:bg-accent hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
