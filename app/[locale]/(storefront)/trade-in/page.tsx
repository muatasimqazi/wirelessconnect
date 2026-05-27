/**
 * Trade-In page — /[locale]/trade-in
 *
 * Allows customers to submit a preliminary device trade-in estimate.
 * IMPORTANT: Online offer is preliminary only. Final offer requires in-person inspection.
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { TradeInForm } from "@/components/store/trade-in-form";
import { InfoIcon, CheckCircleIcon } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface TradeInPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TradeInPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tradeIn" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function TradeInPage({ params }: TradeInPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TradeInContent locale={locale as Locale} />;
}

function TradeInContent({ locale }: { locale: Locale }) {
  const t = useTranslations("tradeIn");

  const steps = [t("howItWorks.step1"), t("howItWorks.step2"), t("howItWorks.step3"), t("howItWorks.step4")];

  return (
    <main>
      {/* Hero */}
      <section className="bg-secondary px-4 py-16 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold md:text-4xl">{t("hero.headline")}</h1>
          <p className="mt-3 text-white/80">{t("hero.subheadline")}</p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Disclaimer banner */}
          <div className="mb-8 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <p>{t("disclaimer")}</p>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* How it works */}
            <div className="space-y-6">
              <div>
                <h2 className="mb-6 text-xl font-bold">{t("howItWorks.title")}</h2>
                <ol className="space-y-4">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <p className="pt-0.5 text-sm text-muted-foreground">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-lg border border-border bg-surface p-5">
                <h3 className="mb-3 font-semibold">{t("weAccept.title")}</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {(["iPhones", "Samsung Galaxy phones", "Google Pixel phones", "iPads & tablets", "MacBooks & laptops", "Accessories"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" aria-hidden="true" />
                      {item}
                    </li>
                  )))}
                </ul>
              </div>
            </div>

            {/* Form */}
            <div>
              <h2 className="mb-6 text-xl font-bold">{t("form.title")}</h2>
              <TradeInForm locale={locale} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
