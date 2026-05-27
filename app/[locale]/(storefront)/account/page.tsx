/**
 * Account Overview — /[locale]/account
 *
 * Shows a summary dashboard: recent orders count, active warranties,
 * and quick links to all account sections.
 */

import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCustomerOrders } from "@/features/orders/queries";
import { getCustomerWarranties } from "@/features/account/queries";
import { getCustomerProfile } from "@/features/account/queries";
import { PackageIcon, UserIcon, MapPinIcon, ShieldCheckIcon } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [profile, orders, warranties] = await Promise.all([
    getCustomerProfile(),
    getCustomerOrders(),
    getCustomerWarranties(),
  ]);

  const activeWarranties = warranties.filter((w) => w.active).length;

  return <AccountOverview locale={locale as Locale} profile={profile} orderCount={orders.length} activeWarranties={activeWarranties} />;
}

function AccountOverview({
  locale,
  profile,
  orderCount,
  activeWarranties,
}: {
  locale: Locale;
  profile: Awaited<ReturnType<typeof getCustomerProfile>>;
  orderCount: number;
  activeWarranties: number;
}) {
  const t = useTranslations("account");

  const cards = [
    {
      title: t("orders"),
      value: orderCount,
      description: t("overview.totalOrders"),
      icon: PackageIcon,
      href: `/${locale}/account/orders`,
    },
    {
      title: t("warranty"),
      value: activeWarranties,
      description: t("overview.activeWarranties"),
      icon: ShieldCheckIcon,
      href: `/${locale}/account/warranty`,
    },
    {
      title: t("profile"),
      value: profile?.full_name ?? t("overview.notSet"),
      description: t("overview.personalInfo"),
      icon: UserIcon,
      href: `/${locale}/account/profile`,
    },
    {
      title: t("addresses"),
      value: null,
      description: t("overview.savedAddresses"),
      icon: MapPinIcon,
      href: `/${locale}/account/addresses`,
    },
  ];

  return (
    <div className="space-y-6">
      {profile?.full_name && (
        <p className="text-muted-foreground">
          {t("overview.welcome", { name: profile.full_name })}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.href} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              {card.value !== null && (
                <p className="mb-2 text-2xl font-bold">{card.value}</p>
              )}
              <p className="mb-3 text-sm text-muted-foreground">{card.description}</p>
              <Button variant="outline" size="sm" asChild>
                <Link href={card.href}>{t("overview.manage")}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
