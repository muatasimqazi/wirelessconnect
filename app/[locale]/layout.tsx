import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { PostHogInit, PostHogPageview } from "@/components/analytics/posthog-provider";
import { routing, localeConfig, type Locale } from "@/i18n/routing";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Locale-aware layout.
 *
 * Sets the correct lang and dir attributes on <html> for:
 * - Accessibility (screen readers, browser language detection)
 * - RTL support (future Arabic, Urdu, Dari, Pashto)
 *   Uses logical CSS properties throughout — no layout rewrite needed when RTL is added.
 *
 * Analytics pattern: PostHogInit and PostHogPageview are null-rendering client
 * components — they do NOT wrap {children}, which would break Next.js App Router's
 * html/body tree detection. PostHogPageview is wrapped in Suspense because it uses
 * useSearchParams (Next.js 15 requirement).
 *
 * See Localization Strategy §4 and §5.
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
    <html
      lang={locale}
      dir={config.direction}
      className={inter.variable}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>

        {/* Analytics — null-rendering client components, no children wrapping */}
        <PostHogInit />
        <Suspense>
          <PostHogPageview />
        </Suspense>
        <Analytics />
      </body>
    </html>
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
