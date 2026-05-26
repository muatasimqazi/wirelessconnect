/**
 * Sign In page.
 *
 * Uses Supabase Auth email + password sign-in via Server Action.
 * On success → redirected to / (or returnTo query param).
 * On failure → error message shown inline (no page reload).
 *
 * Accessibility:
 *  - Form inputs have explicit <label> associations
 *  - Error messages linked to inputs via aria-describedby
 *  - Submit button shows loading state during submission
 *
 * Security:
 *  - Passwords never logged or stored in client state
 *  - CSRF protected by Next.js Server Actions
 *  - Rate limiting applied at Supabase Auth layer
 */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignInForm } from "./sign-in-form";
import { Link } from "@/i18n/navigation";

interface SignInPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}

export async function generateMetadata({ params }: SignInPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("signIn") };
}

export default async function SignInPage({ params, searchParams }: SignInPageProps) {
  const { locale } = await params;
  const { returnTo, error } = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-xl font-bold text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Wireless Connect
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground">{t("signIn")}</h1>
        </div>

        {/* Auth error from callback (e.g. email link expired) */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error === "email_not_confirmed"
              ? "Please check your email to confirm your account."
              : "Authentication error. Please try again."}
          </div>
        )}

        <SignInForm returnTo={returnTo} />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            {t("signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
}
