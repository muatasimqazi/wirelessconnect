/**
 * Account Profile — /[locale]/account/profile
 *
 * Server Component shell: fetches profile data, passes to client form.
 */

import { setRequestLocale } from "next-intl/server";
import { getCustomerProfile } from "@/features/account/queries";
import { ProfileForm } from "./profile-form";

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const profile = await getCustomerProfile();
  return <ProfileForm profile={profile} />;
}
