import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { PostHogInit, PostHogPageview } from "@/components/analytics/posthog-provider";
import { LocaleHtmlAttributes } from "@/components/layout/locale-html-attributes";
import { routing, localeConfig, type Locale } from "@/i18n/routing";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Locale-aware layout.
 *
 * Next.js 15 requires <html> and <body> in the root layout (app/layout.tsx).
 * Lang and dir are applied client-side by LocaleHtmlAttributes immediately
 * after hydration using suppressHydrationWarning on the root html/body tags.
 *
 * RTL support (future Arabic, Urdu, Dari, Pashto) is architecturally ready —
 * LocaleHtmlAttributes sets dir correctly on the <html> element.
 *
 * Analytics uses null-rendering client components that do NOT wrap {children},
 * which would break Next.js App Router's html/body tree detection.
 */
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale — redirect to 404 for unknown locales
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const config = localeConfig[locale as Locale];

  return (
    <>
      {/* Set correct lang/dir on <html> immediately after hydration.
          The root layout defaults to lang="en"; this corrects it for other locales. */}
      <LocaleHtmlAttributes locale={locale} dir={config.direction} />

      <NextIntlClientProvider messages={messages} locale={locale}>
        {children}
      </NextIntlClientProvider>

      {/* Analytics — null-rendering client components; do NOT wrap children */}
      <PostHogInit />
      <Suspense>
        <PostHogPageview />
      </Suspense>
      <Analytics />
    </>
  );
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.hero" });

  return {
    title: {
      default: "Wireless Connect",
      template: "%s | Wireless Connect",
    },
    description: t("subheadline"),
    alternates: {
      canonical: `https://wirelessconnectnw.com/${locale}`,
      languages: {
        en: "https://wirelessconnectnw.com/en",
        es: "https://wirelessconnectnw.com/es",
        "x-default": "https://wirelessconnectnw.com/en",
      },
    },
  };
}
