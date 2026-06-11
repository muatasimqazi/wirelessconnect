"use client";

/**
 * AccountNav — client component.
 *
 * Sidebar nav on desktop, horizontal tabs on mobile.
 * Highlights the active route. Includes a Sign Out button.
 */

import { usePathname, useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "@/features/account/actions";
import { LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

interface AccountNavProps {
  items: NavItem[];
}

export function AccountNav({ items }: AccountNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("account");

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav aria-label="Account navigation">
      {/* Mobile: horizontal scroll row */}
      <div className="flex gap-1 overflow-x-auto pb-1 lg:hidden">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              isActive(item)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Desktop: vertical sidebar */}
      <ul className="hidden lg:flex lg:flex-col lg:gap-0.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}

        <li className="mt-4 border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOutIcon className="h-4 w-4" aria-hidden="true" />
            {t("signOut")}
          </Button>
        </li>
      </ul>
    </nav>
  );
}
