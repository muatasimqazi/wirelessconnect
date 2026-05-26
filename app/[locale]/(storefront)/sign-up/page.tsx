/**
 * Sign Up page.
 *
 * Creates a new customer account via Supabase Auth.
 * After sign-up, Supabase sends a confirmation email (routed through Resend).
 * The user must confirm before their session is active.
 *
 * The `handle_new_user` DB trigger automatically creates a `profiles` row
 * when auth.users is inserted — no manual profile creation needed.
 */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignUpForm } from "./sign-up-form";
import { Link } from "@/i18n/navigation";

interface SignUpPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SignUpPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("signUp") };
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-xl font-bold text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Wireless Connect
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground">{t("signUp")}</h1>
        </div>

        <SignUpForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
