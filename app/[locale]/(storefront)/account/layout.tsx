/**
 * Account layout — server component.
 *
 * Guards all /account/* routes. Redirects to /sign-in if not authenticated.
 * Renders a persistent sidebar nav for desktop and a top tab bar for mobile.
 */

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AccountNav } from "@/components/account/account-nav";
import type { Locale } from "@/i18n/routing";

interface AccountLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AccountLayout({ children, params }: AccountLayoutProps) {
  const { locale } = await params;

  // Auth guard — redirect guests to sign-in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in?returnTo=/account`);
  }

  const t = await getTranslations({ locale, namespace: "account" });

  const navItems = [
    { href: `/${locale}/account`, label: t("nav.overview"), exact: true },
    { href: `/${locale}/account/orders`, label: t("orders") },
    { href: `/${locale}/account/profile`, label: t("profile") },
    { href: `/${locale}/account/addresses`, label: t("addresses") },
    { href: `/${locale}/account/warranty`, label: t("warranty") },
  ];

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Sidebar nav */}
        <aside className="w-full shrink-0 lg:w-56">
          <AccountNav items={navItems} locale={locale as Locale} />
        </aside>

        {/* Page content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
