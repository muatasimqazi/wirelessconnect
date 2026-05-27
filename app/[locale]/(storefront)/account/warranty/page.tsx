/**
 * Account Warranty — /[locale]/account/warranty
 *
 * Lists the customer's warranty records and allows submitting a claim.
 */

import { setRequestLocale } from "next-intl/server";
import { getCustomerWarranties } from "@/features/account/queries";
import { WarrantyList } from "@/components/account/warranty-list";
import type { Locale } from "@/i18n/routing";

interface WarrantyPageProps {
  params: Promise<{ locale: string }>;
}

export default async function WarrantyPage({ params }: WarrantyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const warranties = await getCustomerWarranties();
  return <WarrantyList warranties={warranties} locale={locale as Locale} />;
}
