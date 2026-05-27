/**
 * Repairs page — /[locale]/repairs
 *
 * Appointment request form for device repairs.
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { RepairForm } from "@/components/store/repair-form";
import { WrenchIcon, ClockIcon, PhoneIcon } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface RepairsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: RepairsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "repairs" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function RepairsPage({ params }: RepairsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RepairsContent locale={locale as Locale} />;
}

function RepairsContent({ locale }: { locale: Locale }) {
  const t = useTranslations("repairs");

  const services = [
    t("services.screenRepair"),
    t("services.batteryReplacement"),
    t("services.chargingPort"),
    t("services.cameraRepair"),
    t("services.waterDamage"),
    t("services.softwareIssues"),
  ];

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
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Services + info */}
            <div className="space-y-8">
              {/* Services */}
              <div>
                <h2 className="mb-4 text-xl font-bold">{t("services.title")}</h2>
                <ul className="space-y-2">
                  {services.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <WrenchIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Turnaround */}
              <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="font-semibold">{t("turnaround.title")}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t("turnaround.description")}</p>
              </div>

              {/* Walk-in note */}
              <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="font-semibold">{t("walkIn.title")}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t("walkIn.description")}</p>
                <a href="tel:+12064232965" className="text-sm font-medium text-primary hover:underline">
                  (206) 423-2965
                </a>
              </div>
            </div>

            {/* Form */}
            <div>
              <h2 className="mb-6 text-xl font-bold">{t("form.title")}</h2>
              <RepairForm locale={locale} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
