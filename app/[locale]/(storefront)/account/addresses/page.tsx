/**
 * Account Addresses — /[locale]/account/addresses
 *
 * Lists saved addresses. Lets customers add, edit (inline), and delete addresses.
 * Server shell fetches data; client component handles form interactions.
 */

import { setRequestLocale } from "next-intl/server";
import { getCustomerAddresses } from "@/features/account/queries";
import { AddressesManager } from "@/components/account/addresses-manager";
import type { Locale } from "@/i18n/routing";

interface AddressesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AddressesPage({ params }: AddressesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const addresses = await getCustomerAddresses();
  return <AddressesManager addresses={addresses} locale={locale as Locale} />;
}
